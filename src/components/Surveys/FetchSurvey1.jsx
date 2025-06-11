import React, { useState, useEffect } from 'react';
import SurveyRenderer from '../SurveyTypes/SurveyRenderer1.jsx'; // Ensure correct path to SurveyRenderer

// Fetch dynamic survey JSON and render the survey
const FetchSurvey = () => {
  const [surveyJSON, setSurveyJSON] = useState(null); // Stores the fetched survey JSON
  const [loading, setLoading] = useState(true); // Displays loading indicator
  const [error, setError] = useState(null); // Tracks errors

  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/moyo'); // Fetch dynamic survey JSON from backend

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`); // If fetch fails, throw an error
        }

        const data = await response.json(); // Parse JSON from response
        console.log('Fetched Data:', data); // Check API response

        if (!Array.isArray(data)) {
          throw new Error('API response is not an array. Please check the API format.');
        }

        // Transform fetched data into SurveyJS format
        const transformedJSON = {
          title: "User Satisfaction Questionnaire",
          completedHtml: "<h3>Gracias por completar la encuesta.</h3>",
          pages: [
            {
              name: "page1",
              elements: data.map((question) => { // Loop for each question of the backend request
                const element = {
                  name: `Question${question.Q_NUMBER}`, // Ensure unique question name
                  title: question.Q_TEXT, // Set question text
                  Q_ID: question.Q_ID, // Include Q_ID
                };

                if (question.Q_TYPE === 'rating') { // If the Question is a Rating, then set the following properties
                  element.type = 'rating'; // Sets the type of element to be displayed
                  element.isRequired = true; // Question must always be answered
                  element.rateMin = 0;
                  element.rateMax = 10;
                  element.minRateDescription = "(Not Satisfied)"; // Intuitive labels to guide the user
                  element.maxRateDescription = "(Very Satisfied)"; // Intuitive Labeling to guide user
                }

                if (question.Q_TYPE === 'checkbox') { // If the Question is a Checkbox, then set the following properties
                  element.type = 'checkbox'; 
                  element.isRequired = true;
                  element.description = "Select up to three features";
                  element.validators = [
                    {
                      type: "answercount",
                      text: "Please select no more than three features.",
                      maxCount: 3,
                    },
                  ];
                  element.choices = Object.keys(question) // It loops through the JSON Object from the API Request
                    .filter((key) => key.startsWith("Choice_") && question[key]) // It filters the keys that start with choices
                    .map((key) => ({ // It maps each choice with its corresponding text
                      value: question[key], // Gives each choice its properties
                      text: question[key],
                    }));
                  element.colCount = 2;
                  element.maxSelectedChoices = 3;
                }

                if (question.Q_TYPE === 'comment') {
                  element.type = 'comment';
                }

                return element;
              }),
            },
          ],
          showQuestionNumbers: "on",
        };

        setSurveyJSON(transformedJSON); // Set survey JSON
        setLoading(false); // Stop loading indicator
      } catch (err) {
        console.error('Error fetching survey data:', err); // Log error
        setError('Failed to fetch survey data. Please try again later.');
        setLoading(false);
      }
    };

    fetchSurveyData(); // Call function to fetch survey JSON
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <SurveyRenderer surveyJSON={surveyJSON} />; // Render the survey
};

export default FetchSurvey;