# Cold Email Generator

A web-based cold email generator powered by LLAMA-3.1, Streamlit, and Chroma DB. This application generates personalized cold emails based on the job description and the user's resume. The project allows job seekers to automate their outreach with tailored emails, increasing their chances of getting noticed.

## Features

- **Cold Email Generation**: Generate personalized cold emails based on a job description and resume.
- **LLAMA-3.1**: Uses the LLAMA-3.1 model to craft relevant and persuasive emails.
- **Chroma DB**: Stores the vector representation of portfolio projects to customize email content.
- **Streamlit Frontend**: Easy-to-use web interface for uploading resumes and job descriptions.
- **Job Description Extraction**: Automatically extracts job descriptions from websites.
  
## Requirements

- Python 3.x
- LLAMA-3.1
- Chroma DB
- Streamlit
- BeautifulSoup (for web scraping job descriptions)
- Requests (for making HTTP requests to fetch job descriptions)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/cold-email-generator.git
   cd cold-email-generator
