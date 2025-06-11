import React, { useState } from 'react';
import './addingquestions.css'; // Import your styles

const AddQuestions = () => {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('comment');
  const [choices, setChoices] = useState(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);

  // Handle choice change
  const handleChoiceChange = (index, value) => {
    const updatedChoices = [...choices];
    updatedChoices[index] = value;
    setChoices(updatedChoices);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const questionData = {
      question_text: questionText,
      question_type: questionType,
      choices:
        questionType === 'checkbox' 
          ? choices.filter((choice) => choice.trim() !== '') // Filter empty choices
          : [],
    };

    console.log('Sending question data:', questionData); // Debugging

    try {
      const response = await fetch('http://localhost:3002/api/add-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });

      const data = await response.json();
      console.log(' API Response:', data); // Debugging

      if (data.message.includes('added successfully')) {
        alert('Question added successfully!');
      } else {
        alert(' Failed to add question! Check console for details.');
      }
    } catch (error) {
      console.error(' Error adding question:', error);
      alert('Error adding question! Check console.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className = "adding-questions-page" /* Definining the Class Name*/>
    <div className="add-question-container"/* Definining the Class Name for the Container*/>
      <h2>Add New Question</h2> 
      <form onSubmit={handleSubmit} /* Calling the function HandleSubmit to send data to backend*/>
        <label>Question Text:</label>
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)} /* Updating the Variable whenever the text changes*/
          required
        />
        <label>Question Type:</label>
        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)} /* Updating the type of question whenever the dropdown changes*/
        >
          <option value="comment" >Comment</option> 
          <option value="checkbox">Checkbox</option>
          <option value="rating">Rating</option>
        </select>
        {(questionType === 'checkbox') && ( /* Applying Conditional Rendering, to display more text boxes only when Checkbox is clicked*/
          <> 
            <label>Choices:</label>
            {choices.map((choice, index) => ( /* Loop through a 6 element array of empty strings, to create 6 input boxes*/
              <input
                key={index}
                type="text"
                value={choice}
                onChange={(e) => handleChoiceChange(index, e.target.value)}
                placeholder={`Choice ${index + 1}`} /* Placeholders for improved ease of use*/
              />
            ))}
          </>
        )}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Question'}
        </button>
      </form>
    </div>
    </div>
  );
};
export default AddQuestions;
