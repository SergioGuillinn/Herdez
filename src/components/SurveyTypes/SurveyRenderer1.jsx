import React from 'react';
import 'survey-react/survey.css';
import * as Survey from 'survey-react';
import axios from 'axios';

const onComplete = (survey, surveyJSON) => {
  console.log('Survey data on submit:', survey.data);

  const surveyData = survey.data; // User's responses
  const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // SQL formatted date

  // Extract question IDs (q_id) and match them with responses
  const surveyQuestions = surveyJSON.pages.flatMap((page) =>
    page.elements.map((element) => ({
      name: element.name,
      Q_ID: element.Q_ID, // Use the q_id for database mapping
    }))
  );

  // Prepare the response_answers payload
  const responseAnswers = Object.keys(surveyData).map((key) => {
    const question = surveyQuestions.find((q) => q.name === key);
    const value = surveyData[key];

    return {
      Q_ID: question.Q_ID, 
      R_Value: typeof surveyData[key] === 'object' ? JSON.stringify(surveyData[key]) : surveyData[key], 
    };
  });

  // Prepare the full payload for the POST request
  const payload = {
    R_Date: currentDate, // Submission date
    B_ID: 'MY', // 
    response_answers: responseAnswers,
  };

  console.log('Payload being sent to backend:', payload);

  // Send the payload to the backend
  axios
    .post('http://localhost:3002/api/herdez', payload)
    .then((response) => {
      console.log('Data saved successfully:', response.data);
    })
    .catch((error) => {
      console.error(
        'Error saving data:',
        error.response ? error.response.data : error.message
      );
    });
};

const SurveyRenderer = ({ surveyJSON }) => {
  if (!surveyJSON) {
    return <div>No survey data available</div>; // Handle missing survey data
  }

  return (
    <Survey.Survey
      json={surveyJSON} // Pass survey JSON to SurveyJS
      onComplete={(survey) => onComplete(survey, surveyJSON)} // Pass surveyJSON to onComplete
    />
  );
};

export default SurveyRenderer;
