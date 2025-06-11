import React, { useState, useEffect } from 'react';
import './SurveyManagement.css';

const SurveyManagement = () => {
  const [businessId, setBusinessId] = useState('');
  const [status, setStatus] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredQuestionId, setHoveredQuestionId] = useState(null);
  const [questionNumbers, setQuestionNumbers] = useState({});

  useEffect(() => {
    if (businessId && status) {
      fetchQuestions();
    }
  }, [businessId, status]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = { businessID: businessId, status };

      const response = await fetch('http://localhost:3002/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setQuestions(data);
      } else {
        setError(data.message || 'Error fetching questions');
      }
    } catch (err) {
      setError('Error fetching questions');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (questionId) => {
    const questionNumber = questionNumbers[questionId];
    if (!questionNumber) {
      alert('Please enter a question number to activate.');
      return;
    }
    const body = {
      questionId,
      status: 'active',
      questionNumber,
      businessID: businessId,
    };

    try {
      const response = await fetch('http://localhost:3002/api/update-question-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Question activated successfully!');
        fetchQuestions();
      } else {
        alert(data.error || 'Error activating question');
      }
    } catch (err) {
      alert('Error updating question status');
    }
  };

  const handleHide = async (questionId) => {
    const body = {
      questionId,
      status: 'inactive',
      businessID: businessId,
    };

    try {
      const response = await fetch('http://localhost:3002/api/update-question-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Question hidden successfully!');
        fetchQuestions();
      } else {
        alert(data.error || 'Error hiding question');
      }
    } catch (err) {
      alert('Error updating question status');
    }
  };
  return (
    <div className="survey-management"> {/* Main container for the survey management section */}
      <h1>Survey Management</h1> {/* Page title */}
  
      {/* 🔍 Filters Section */}
      <div className="filters">
        <div>
          <label>Business ID</label> {/* Label for business ID dropdown */}
          <select value={businessId} onChange={(e) => setBusinessId(e.target.value)}> {/* Dropdown to select a business */}
            <option value="">Select</option> {/* Default option */}
            <option value="NT">NT</option> {/* Business option NT */}
            <option value="CB">CB</option> {/* Business option CB */}
            <option value="MY">MY</option> {/* Business option MY */}
            <option value="CL">CL</option> {/* Business option MY */} 
          </select>
        </div>
  
        <div>
          <label>Status</label> {/* Label for status dropdown */}
          <select value={status} onChange={(e) => setStatus(e.target.value)}> {/* Dropdown to select question status */}
            <option value="">Select</option> {/* Default option */}
            <option value="active">Active</option> {/* Shows active questions */}
            <option value="inactive">Inactive</option> {/* Shows inactive questions */}
          </select>
        </div>
      </div>
  
      {/*  Display loading state if questions are being fetched */}
      {loading && <p>Loading questions...</p>}
  
      {/* Show error message if fetching fails */}
      {error && <p className="error">{error}</p>}
  
      {/*  Questions List Section */}
      <div className="question-list">
        {questions.length > 0 ? ( /* If there are questions, render them */
          questions.map((question) => (
            <div
              key={question.Q_ID}
              className="question-panel" /* Wrapper for individual question */
              onMouseEnter={() => setHoveredQuestionId(question.Q_ID)} /* Tracks when user hovers over a question */
              onMouseLeave={() => setHoveredQuestionId(null)} /* Removes hover tracking when user leaves */
            >
              <div className="question-info"> {/* Container for question details */}
                <p><strong>Q_ID:</strong> {question.Q_ID}</p> {/* Displays Question ID */}
                <p><strong>Q_Text:</strong> {question.Q_TEXT}</p> {/* Displays Question Text */}
                <p><strong>Q_Type:</strong> {question.Q_TYPE}</p> {/* Displays Question Type */}
                <p>
                  <strong>Q_Number:</strong> 
                  {status === 'inactive' ? 'No Current Number' : question.Q_NUMBER} {/* Shows question number or 'No Current Number' for inactive questions */}
                </p>
  
                {/*  Show "Enter Question Number" input only when hovering over an inactive question */}
                {hoveredQuestionId === question.Q_ID && status === 'inactive' && (
                  <div className="question-number-input">
                    <label>Enter Question Number</label> {/* Label for question number input */}
                    <input
                      type="text"
                      value={questionNumbers[question.Q_ID] || ''} /* Shows existing input value */
                      onChange={(e) =>
                        setQuestionNumbers({ ...questionNumbers, [question.Q_ID]: e.target.value })
                      } /* Updates state when input changes */
                      placeholder="Enter question number" /* Placeholder text */
                    />
                  </div>
                )}
              </div>
  
              {/*  Question Actions Section */}
              <div className="question-actions">
                {/*  Show "Activate" button only for inactive questions */}
                {status === 'inactive' && <button onClick={() => handleActivate(question.Q_ID)}>Activate</button>}
                
                {/*  Show "Hide" button only for active questions */}
                {status === 'active' && <button onClick={() => handleHide(question.Q_ID)}>Hide</button>}
              </div>
            </div>
          ))
        ) : (
          <p>No questions available</p> /* Show message if no questions are found */
        )}
      </div>
    </div>
  );
};

export default SurveyManagement;
