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

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("job_description_link", jobDescriptionLink);
    formData.append("resume_file_content", resumeFile);

    try {
      const response = await axios.post("http://localhost:3000/api/generate_email", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.cold_email) {
        setColdEmail(response.data.cold_email);
      } else {
        setErrorMessage("Failed to generate a cold email. Please try again.");
      }
    } catch (error) {
      console.error("Error generating email:", error);
      const errorMsg =
        error.response?.data?.error ||
        "An error occurred while generating the email. Please check your network or backend server.";
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "white",
        fontFamily: "'Roboto', sans-serif",
        padding: "20px",
        color: "black",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          background: "#222222",
          padding: "50px",
          borderRadius: "10px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "20px", color: "#2EA55F" }}>Cold Email Generator</h1>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block", color: "white" }}>Job Description Link:</label>
          <input
            type="text"
            placeholder="Enter job description link"
            value={jobDescriptionLink}
            onChange={(e) => setJobDescriptionLink(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #CCC",
              borderRadius: "5px",
              background: "#FFF",
              color: "#333",
            }}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block", color: "white" }}>Resume File (PDF):</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #CCC",
              borderRadius: "5px",
              background: "#FFF",
              color: "#333",
            }}
          />
        </div>
        <button
          onClick={generateColdEmail}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: "white",
            color: "#2EA55F",
            border: "none",
            borderRadius: "50px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#2C974B",e.target.style.color = "white")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "white",e.target.style.color = "#2EA55F")}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Cold Email"}
        </button>

        {errorMessage && (
          <div style={{ color: "red", marginTop: "15px" }}>
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        {coldEmail && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              border: "1px solid #CCC",
              borderRadius: "10px",
              background: "#F9F9F9",
              color: "#333",
            }}
          >
            <h2 style={{ marginBottom: "10px",color: "#2EA55F" }}>Generated Cold Email:</h2>
            <p>{coldEmail}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColdEmailGenerator;