import logging
import streamlit as st
import os
from flask import Flask, request, jsonify
from streamlit.web.server.server import Server
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.document_loaders import WebBaseLoader
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import chromadb
import uuid
import pandas as pd
import PyPDF2
from flask_cors import CORS




st.title("Cold Email Generator")


@st.cache_resource
def inital_setup():
    
    load_dotenv()

    df = pd.read_csv("my_portfolio.csv")

    chroma_client = chromadb.PersistentClient()
    collection = chroma_client.get_or_create_collection(name="TechStack")

    if not collection.count():
        for _,row in df.iterrows():
            document_id = str(uuid.uuid4())

            collection.add(
                documents=[row['Techstack']], 
                metadatas=[{'link': row['Links']}],  
                ids=[document_id]  
            )

    return collection

def get_llm_model():
    llm = ChatGroq(model="llama-3.1-70b-versatile",temperature=0.8)
    return llm

def get_web_data(job_description):
    try:
        
        loader = WebBaseLoader(web_path=job_description)
        page_data = loader.load().pop().page_content
        return [1,page_data]
        
    except IndexError:
        return [0,"Error: No content found at the provided link. Please check the URL and try again."]
    
    except ValueError as ve:
        return [0,f"Error: Invalid input provided. Details: {ve}"]
    
    except Exception as e:
        return [0,f"Error: An unexpected error occurred. Details: {e}"]
    

def get_job_description_json(job_data,llm):
    template =PromptTemplate.from_template ("""
        ### Scraped Text From Website :
        {job_data}
        ## Instruction  
        Based on the data given above is the content of career's page of a website.
        You are requiremt to extract the job posting and return them in JSON fromat with no PREAMBLE.
        These should be the keys: 'role', 'expereince' ,'skills' and 'description' .
        ONLY return VALID JSON.                              
        """)

    parser = JsonOutputParser()

    chain = template | llm | parser
    response=chain.invoke(input={'job_data':job_data})
    return response

def get_links(skills,collection):
   
    links = collection.query(
    query_texts=['Experience in Python','Expereicne in React'],
    n_results=1
    )['metadatas']
    return links

def get_resume_content(uploaded_file):
    try:
        # Read the PDF file using PyPDF2
        pdf_reader = PyPDF2.PdfReader(uploaded_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        logging.error(f"Error while reading PDF: {e}")
        return f"Error while reading PDF: {e}"

# def get_resume_content(uploaded_file):
#     try:
#         pdf_reader = PyPDF2.PdfReader(uploaded_file)
#         text = "".join([page.extract_text() for page in pdf_reader.pages])
#         return text
#     except Exception as e:
#         return f"Error while reading PDF: {e}"


def get_cold_email(output,links,llm,pdf_text):
    prompt_email = PromptTemplate.from_template(
        """
        ### JOB DESCRIPTION:
        {job_description}
        
        ### RESUME CONTENT
        {resume_text}

        ### INSTRUCTION:
        You are an expert cold-email generation. On the basis of the job description and the resume  provided above generate a cold-email for the 
        job descriton.
        Your job is to write a cold email to the client regarding the job mentioned above describing the capability 
        in fulfilling their needs.
        Draft a very professional cold-email, with minimum 3 paragraphs, and at the end of the email also add 
        the name of the user as mentioned in the resume.
        Also add the most relevant ones from the following links to showcase my portfolio: {link_list} 
        use proper punchuation adn grammer.
        Do not provide a preamble.
        ### EMAIL (NO PREAMBLE):
        
        """
        )

    chain_email = prompt_email | llm

    res = chain_email.invoke({"job_description":output['description'],"link_list":links,"resume_text":pdf_text}).content

    return res


uploaded_file = st.file_uploader("Upload your resume PDF", type=["pdf"])


job_description_link = st.text_input("Enter the job description link")


collection = inital_setup()

if st.button("Generate Cold Email"):
    if uploaded_file and job_description_link:

        job_data = get_web_data(job_description_link)


        if(job_data[0]==0):
        
            st.write(job_data[1])
        
        else:
            
            llm = get_llm_model()
            
            data = job_data[1]

            response = get_job_description_json(job_data=data,llm=llm)

            print(response)

            links = get_links(response['skills'],collection)
            

            pdf_text = get_resume_content(uploaded_file)

            cold_email = get_cold_email(response,links,llm)

            st.subheader("The Cold Main is : ")

            st.write("\n")
            st.write(cold_email)

    else:
        st.warning("Please upload a resume and provide a job description link.")


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Initialize collection
collection = inital_setup()

# Set up logging
logging.basicConfig(level=logging.INFO)
@app.route('/api/generate_email', methods=['OPTIONS', 'POST'])
def generate_email():
    if request.method == 'OPTIONS':
        # Preflight response
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response

    try:
        # Get data from the request
        job_description_link = request.form.get('job_description_link', '')
        resume_file = request.files.get('resume_file_content')

        # Validate input
        if not job_description_link:
            return jsonify({"error": "Job description link is required"}), 400
        if not resume_file:
            return jsonify({"error": "Resume file is required"}), 400

        # Step 1: Scrape job description
        logging.info("Scraping job description...")
        job_data = get_web_data(job_description_link)
        if job_data[0] == 0:
            return jsonify({"error": f"Failed to scrape job description: {job_data[1]}"}), 400

        job_description = job_data[1]

        # Step 2: Initialize LLM
        logging.info("Initializing LLM model...")
        llm = get_llm_model()

        # Step 3: Extract job description in JSON format
        logging.info("Extracting job description in JSON format...")
        job_description_json = get_job_description_json(job_data=job_description, llm=llm)

        # Step 4: Query links based on extracted skills
        logging.info("Querying links based on extracted skills...")
        links = get_links(job_description_json['skills'], collection)

        # Step 5: Extract resume text from the uploaded PDF
        logging.info("Extracting resume content from PDF...")
        pdf_text = get_resume_content(resume_file)

        # Step 6: Generate cold email
        logging.info("Generating cold email...")
        cold_email = get_cold_email(job_description_json, links, llm, pdf_text)

        # Step 7: Return the generated cold email
        response = jsonify({"cold_email": cold_email})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        return response

    except Exception as e:
        logging.error(f"An error occurred: {str(e)}", exc_info=True)
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))  # Default to 3000 for local testing
    app.run(host='0.0.0.0', port=port)