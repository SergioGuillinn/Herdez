import React from 'react';
import 'survey-react/survey.css';
import * as Survey from 'survey-react';
import axios from 'axios';
import surveyJSON from '../Surveys/survey';

const onComplete = (survey, options) => {
  const surveyData = survey.data;

  // Map the survey data to the database columns
  const dataForDatabase = {
    Question1: surveyData.nps_score || '',
    Question2: surveyData.satisfaccion || '',
    Question3: surveyData.Gustos || '',
    Question4: surveyData.Mejora || '',
    Question5: surveyData.Adiciones || '',
    Date: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };

  // Send the data to your backend API using axios
  axios.post('http://localhost:3001/api/herdez', dataForDatabase)
    .then((response) => {
      console.log('Data saved successfully:', response.data);
    })
    .catch((error) => {
      console.error('Error saving data:', error.response ? error.response.data : error.message);
    });
};

const MySurvey = () => {
  return (
    <Survey.Survey
      json={surveyJSON}
      onComplete={onComplete}
    />
  );
};

export default MySurvey;