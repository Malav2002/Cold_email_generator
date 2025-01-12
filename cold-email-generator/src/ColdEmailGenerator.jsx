import React, { useState } from "react";
import axios from "axios";

const ColdEmailGenerator = () => {
  const [jobDescriptionLink, setJobDescriptionLink] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [coldEmail, setColdEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle file selection
  const handleFileChange = (event) => {
    setResumeFile(event.target.files[0]);
    setErrorMessage("");
  };

  // Function to generate the cold email
  const generateColdEmail = async () => {
    if (!jobDescriptionLink || !resumeFile) {
      setErrorMessage("Please provide both a job description link and a resume file.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setColdEmail("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const resumeFileContent = event.target.result;

      try {
        const response = await axios.post("http://localhost:5000/api/generate_email", {
          job_description_link: jobDescriptionLink,
          resume_file_content: resumeFileContent,
        });

        if (response.data.cold_email) {
          setColdEmail(response.data.cold_email);
        } else {
          setErrorMessage("Failed to generate a cold email. Please try again.");
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.error || "An error occurred while generating the email.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(resumeFile);
  };

  return (
    <div style={{ margin: "20px" }}>
      <h1>Cold Email Generator</h1>
      <div style={{ marginBottom: "15px" }}>
        <label>Job Description Link:</label>
        <input
          type="text"
          placeholder="Enter job description link"
          value={jobDescriptionLink}
          onChange={(e) => setJobDescriptionLink(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </div>
      <div style={{ marginBottom: "15px" }}>
        <label>Resume File (PDF):</label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </div>
      <button
        onClick={generateColdEmail}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007BFF",
          color: "#FFF",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate Cold Email"}
      </button>

      {errorMessage && (
        <div style={{ color: "red", marginTop: "15px" }}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {coldEmail && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #CCC", borderRadius: "5px" }}>
          <h2>Generated Cold Email:</h2>
          <p>{coldEmail}</p>
        </div>
      )}
    </div>
  );
};

export default ColdEmailGenerator;
