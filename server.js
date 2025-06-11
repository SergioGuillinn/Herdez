const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();

// Use CORS middleware to enable cross-origin requests
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Ensure the password is correct (leave blank if not set)
  database: 'herdez', // Ensure the 'herdez' database exists
});

// Connect to MySQL database
db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// POST endpoint to save responses
app.post('/api/herdez', (req, res) => {
  console.log('Received request body:', req.body);

  const { R_Date, B_ID, response_answers } = req.body;

  if (!response_answers || response_answers.length === 0) {
    return res.status(400).json({ error: 'No answers found in the request' });
  }

  // Insert into the `responses` table
  const responseQuery = 'INSERT INTO responses (R_Date, B_ID) VALUES (?, ?)';
  db.query(responseQuery, [R_Date, B_ID], (err, result) => {
    if (err) {
      console.error('Error inserting into responses:', err); // Log detailed error
      return res.status(500).json({ error: 'Failed to insert data into responses table' });
    }

    const r_Id = result.insertId; // Get the generated R_ID
    console.log('Inserted into responses, R_ID:', r_Id);

    // Prepare promises for inserting response answers
    const answerInsertPromises = response_answers.map((answer) => {
      const { Q_ID, R_Value } = answer;

      // Stringify R_Value if it's an array
      const finalValue = Array.isArray(R_Value) ? JSON.stringify(R_Value) : R_Value;

      // Insert into response_answers
      const query = 'INSERT INTO response_answers (R_ID, Q_ID, R_Value) VALUES (?, ?, ?)';
      return new Promise((resolve, reject) => {
        db.query(query, [r_Id, Q_ID, finalValue], (err, result) => {
          if (err) {
            console.error('Error inserting into response_answers:', err); // Log detailed error
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    });

    // Execute all promises
    Promise.all(answerInsertPromises)
      .then(() => {
        console.log('All answers inserted successfully');
        res.status(200).json({ message: 'Data received and saved successfully' });
      })
      .catch((error) => {
        console.error('Error inserting answers:', error); // Log the specific error
        res.status(500).json({ error: 'Failed to insert data into response_answers table' });
      });
  });
});

// API endpoint to handle login
app.post('/api/login', (req, res) => { //Create API Request for Login
  const { email, password } = req.body; // Get the Input of the JSX, which is the email and password 

  if (!email || !password) {
    return res.status(400).send('Email and password are required'); // If there is no input, error message to require user for input
  }

  const query = 'SELECT * FROM marketingregister WHERE email = ? AND password = ?';   // Query to check if the email and password are
  const values = [email, password];                                                   // in the database

  db.query(query, values, (err, result) => {                                          // Do the query, and output error and results
    if (err) {
      console.error('Error querying the database:', err);                             // Error Message In case there was an error,
      return res.status(500).send('Database error');                                  //  which facilitates debugging. 
    }

    if (result.length > 0) {
      res.status(200).send({ message: 'Login successful' });                          // If the length of the results bigger >0
    } else {                                                                          // you know there is a record of email and password
      res.status(401).send({ message: 'Invalid email or password' });                 // which means that the login is successful
    }
  });
});

// API endpoint to add a question
app.post('/api/add-question', (req, res) => {
  const { question_text, question_type, choices } = req.body;

  if (!question_text || !question_type) {
    return res.status(400).json({ message: '❌ Question text and type are required' });
  }

  // Insert into `questions` table
  const questionQuery = 'INSERT INTO questions (Q_TEXT, Q_TYPE) VALUES (?, ?)';
  db.query(questionQuery, [question_text, question_type], (err, result) => {
    if (err) {
      console.error('❌ Error inserting question:', err);
      return res.status(500).json({ message: '❌ Error inserting question' });
    }

    const questionId = result.insertId;
    console.log('✅ Inserted Question ID:', questionId);

    if (!questionId) {
      return res.status(500).json({ message: '❌ Invalid question ID' });
    }

    // Insert into `business_question`
    const businessData = [
      ['CB', questionId, null, 0],
      ['MY', questionId, null, 0],
      ['NT', questionId, null, 0],
    ];

    const businessQuery = 'INSERT INTO business_question (B_ID, Q_ID, Q_Number, active) VALUES ?';

    db.query(businessQuery, [businessData], (err) => {
      if (err) {
        console.error('❌ Error inserting into business_question:', err);
        return res.status(500).json({ message: '❌ Error inserting into business_question' });
      }

      // Handle Checkbox and Dropdown Questions (Insert Choices)
      if (question_type === 'checkbox' ) {
        if (!Array.isArray(choices) || choices.length === 0) {
          return res.status(400).json({ message: '❌ Choices are required for Checkbox/Dropdown' });
        }

        const limitedChoices = choices.slice(0, 6); // Limit to 6 choices
        const choiceValues = [
          questionId,
          limitedChoices[0] || null,
          limitedChoices[1] || null,
          limitedChoices[2] || null,
          limitedChoices[3] || null,
          limitedChoices[4] || null,
          limitedChoices[5] || null,
        ];

        const choiceQuery = `
          INSERT INTO choices 
          (Q_ID, Choice_1, Choice_2, Choice_3, Choice_4, Choice_5, Choice_6)  
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(choiceQuery, choiceValues, (err) => {
          if (err) {
            console.error('❌ Error inserting choices:', err);
            return res.status(500).json({ message: '❌ Error inserting choices' });
          }

          return res.status(200).json({ message: '✅ Question, choices, and business records added successfully' });
        });
      } else {
        return res.status(200).json({ message: '✅ Question and business records added successfully' });
      }
    });
  });
});


// POST endpoint to fetch questions based on businessID and status
app.post('/api/questions', (req, res) => {
  const { businessID, status } = req.body;

  // Determine the active value based on the status
  const activeStatus = status === 'active' ? 1 : 0;

  // Query to fetch questions based on status and business ID
  const query = `
  SELECT questions.Q_ID, questions.Q_TEXT, questions.Q_TYPE, business_question.Q_NUMBER
  FROM questions
  INNER JOIN business_question ON questions.Q_ID = business_question.Q_ID
  WHERE business_question.B_ID = ? AND business_question.active = ?`;

  db.query(query, [businessID, activeStatus], (err, results) => {
    if (err) {
      console.error('Error fetching questions:', err);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }
    res.status(200).json(results);
  });
});



app.post('/api/update-question-status', (req, res) => { // Post Route to update data in my table
  const { questionId, status, questionNumber, businessID } = req.body; // Extracts values from the request body 
  if (!questionId || !status || !businessID) { // Checks if required fields are missing
    return res.status(400).json({ error: 'Missing required fields' }); // Returns an error if any required field is missing
  }
  if (status === 'active') { // Checks if the status is 'active'
    if (!questionNumber) { // Ensures questionNumber is provided when activating a question
      return res.status(400).json({ error: 'Question number is required to activate' }); // Returns an error if questionNumber is missing
    }
    const checkQuery = ` 
      SELECT Q_ID 
      FROM business_question 
      WHERE B_ID = ? AND active = 1 AND Q_NUMBER = ?;
    `; // SQL query to check if the same question number is already assigned to another active question in the same business
    db.query(checkQuery, [businessID, questionNumber], (checkErr, checkResult) => { // Executes the query to check for duplicate question numbers
      if (checkErr) { // Checks if there is an error executing the query
        console.error('Error checking existing question number:', checkErr); // Logs the error, which makes it easier for debugging 
        return res.status(500).json({ error: 'Error checking question number' }); // Returns a server error response
      }
      if (checkResult.length > 0) { // Conditional to check if there is two duplicate question numbers
        console.log(`Duplicate Q_NUMBER found for Business ID ${businessID}:`, checkResult); // Logs the error for debugging
        return res
          .status(400)
          .json({ error: `Question number ${questionNumber} is already assigned to another question.` }); // Returns an error response
      }
      const updateQuery = ` 
        UPDATE business_question
        SET active = 1, Q_NUMBER = ?
        WHERE Q_ID = ? AND B_ID = ?;
      `; // SQL query to activate the question and set its question number
      const values = [questionNumber, questionId, businessID]; // Defines the values needed for the uqery 
      db.query(updateQuery, values, (updateErr, updateResult) => { // Executes the query to update the question status
        if (updateErr) { // Checks for errors during the update query 
          console.error('Error updating question status:', updateErr); // Logs the error for debugging 
          return res.status(500).json({ error: 'Error updating question status' }); // Returns a server error response
        }
        res.status(200).json({ message: 'Question activated successfully' }); // Sends a success response when the update is successful
      });
    });
  } else if (status === 'inactive') { // If the status is 'inactive'
    const query = ` 
      UPDATE business_question
      SET active = 0, Q_NUMBER = NULL
      WHERE Q_ID = ? AND B_ID = ?;
    `; // SQL query to update business_question to have a 0 value, which means its inactive
    const values = [questionId, businessID]; // Defines the values needed to execute the query
    db.query(query, values, (err, result) => { // Executes the query to update the question status
      if (err) { // Checks for errors
        console.error('Error updating question status:', err); // Logs the error in the console for debugging
        return res.status(500).json({ error: 'Error updating question status' }); // Server Error 
      }
      res.status(200).json({ message: 'Question hidden successfully' }); // Sends a Pop Up alert to show that the question has been properly hidden
    });
  } else { 
    return res.status(400).json({ error: 'Invalid status' }); // Returns an error for an invalid status value
  }
});


app.get('/api/questionsstats', (req, res) => {
  const query = 'SELECT Q_ID, Q_TEXT FROM questions';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching questions:', err);
      res.status(500).send('Server Error');
    } else {
      res.json(results);
    }
  });
});

app.get('/api/getstats', (req, res) => {
  const { businessId, qId, startDate, endDate, date } = req.query; // Inputs required for the API request

  if (!businessId || !qId) {
    return res.status(400).json({ error: 'Missing required parameters: businessId or qId' }); // If there is an input missing, display an error message
  }

  console.log(`Received request - businessId: ${businessId}, qId: ${qId}`); // Debugging log to verify request params

  const questionTypeQuery = `
    SELECT questions.Q_TYPE
    FROM questions 
    WHERE questions.Q_ID = ?
  `; // This query is utilized to get the question type of the question that I want to get data on. It is vital since it will allow me to do dynamic rendering

  db.query(questionTypeQuery, [qId], (err, questionTypeResults) => {
    if (err) {
      console.error('Error fetching question type:', err);
      return res.status(500).json({ error: 'Error fetching question type' }); // Error message in case the query fails
    }

    console.log('Raw DB Response:', questionTypeResults); // Debugging log to inspect raw DB response

    if (!questionTypeResults || questionTypeResults.length === 0 || !questionTypeResults[0].Q_TYPE) {
      console.error(`No question type found for Q_ID: ${qId}`); // Debugging log
      return res.status(404).json({ error: 'Question not found or missing Q_TYPE' }); // Error message if Q_TYPE is missing
    }

    const questionType = questionTypeResults[0]['Q_TYPE'] || questionTypeResults[0].Q_TYPE; // Ensure Q_TYPE is retrieved correctly
    console.log(`Fetched Q_TYPE: ${questionType}`); // Debugging log to check if Q_TYPE is returned correctly

    let query = `
      SELECT response_answers.R_Value
      FROM responses 
      INNER JOIN response_answers ON responses.R_ID = response_answers.R_ID
      WHERE responses.B_ID = ? AND response_answers.Q_ID = ?
    `; // This is the base query, which is going to have more conditions when the date is introduced. It retrieves the responses of a specific question ID, from a specific business ID
    
    const queryParams = [businessId, qId];

    if (date) {
      query += ' AND responses.R_DATE = ?'; // Add into the query the date if only a specific date is selected
      queryParams.push(date);
    } else if (startDate && endDate) {
      query += ' AND responses.R_DATE BETWEEN ? AND ?'; // Add into the query a range of dates if a range is selected
      queryParams.push(startDate, endDate);
    }

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching data:', err); // Error Message to make it easier for debugging
        return res.status(500).json({ error: 'Error fetching data' });
      }

      console.log(`Retrieved ${results.length} responses for Q_ID: ${qId}`); // Debugging log to check response count

      res.json({
        q_type: questionType, // Ensure the API always returns q_type
        data: results.length > 0 ? results : [], // Return an empty array if there are no responses
      });
    });
  });
});



app.get('/api/chillim', (req, res) => {
  const businessID = req.query.b_id || 'CB'; // Hardcoding Business ID, since the frontend will be different for each brand
  
  // Updated SQL query to include q.Q_ID
  const query = ` 
SELECT 
    business_question.Q_NUMBER, 
    questions.Q_ID,  -- Include the unique question ID
    questions.Q_TEXT, 
    questions.Q_TYPE,
    choices.Choice_1,
    choices.Choice_2,
    choices.Choice_3,
    choices.Choice_4,
    choices.Choice_5,
    choices.Choice_6
FROM 
    business_question
JOIN 
    questions ON business_question.Q_ID = questions.Q_ID
LEFT JOIN 
    choices ON questions.Q_ID = choices.Q_ID
WHERE 
    business_question.B_ID = ?
    AND business_question.active = 1
ORDER BY 
    business_question.Q_NUMBER;

  `;

  // Execute the query and handle the response
  db.query(query, [businessID], (err, results) => {
    if (err) {
      console.error('Database query error:', err); // Log the error for debugging
      res.status(500).json({ error: 'Database query failed' });
    } else {
      res.json(results);
    }
  });
});



app.get('/api/nutrisa', (req, res) => {
  const businessID = req.query.b_id || 'NT'; // Hardcoding Business ID, since the frontend will be different for each brand
  
  // Updated SQL query to include q.Q_ID
  const query = ` 
SELECT 
    business_question.Q_NUMBER, 
    questions.Q_ID,  -- Include the unique question ID
    questions.Q_TEXT, 
    questions.Q_TYPE,
    choices.Choice_1,
    choices.Choice_2,
    choices.Choice_3,
    choices.Choice_4,
    choices.Choice_5,
    choices.Choice_6
FROM 
    business_question
JOIN 
    questions ON business_question.Q_ID = questions.Q_ID
LEFT JOIN 
    choices ON questions.Q_ID = choices.Q_ID
WHERE 
    business_question.B_ID = ?
    AND business_question.active = 1
ORDER BY 
    business_question.Q_NUMBER;

  `;
  // Execute the query and handle the response
  db.query(query, [businessID], (err, results) => {
    if (err) {
      console.error('Database query error:', err); // Log the error for debugging
      res.status(500).json({ error: 'Database query failed' }); // Sends an error status 500
    } else {
      res.json(results); // Sends an JSON to be displayed, which indicates that the query was sucessful
    }
  });
});


app.get('/api/moyo', (req, res) => {
  const businessID = req.query.b_id || 'MY'; // Hardcoding Business ID, since the frontend will be different for each brand
  
  // Updated SQL query to include q.Q_ID
  const query = ` 
SELECT 
    business_question.Q_NUMBER, 
    questions.Q_ID,  -- Include the unique question ID
    questions.Q_TEXT, 
    questions.Q_TYPE,
    choices.Choice_1,
    choices.Choice_2,
    choices.Choice_3,
    choices.Choice_4,
    choices.Choice_5,
    choices.Choice_6
FROM 
    business_question
JOIN 
    questions ON business_question.Q_ID = questions.Q_ID
LEFT JOIN 
    choices ON questions.Q_ID = choices.Q_ID
WHERE 
    business_question.B_ID = ?
    AND business_question.active = 1
ORDER BY 
    business_question.Q_NUMBER;

  `;

  // Execute the query and handle the response
  db.query(query, [businessID], (err, results) => {
    if (err) {
      console.error('Database query error:', err); // Log the error for debugging
      res.status(500).json({ error: 'Database query failed' });
    } else {
      res.json(results);
    }
  });
});

app.get('/api/cielito', (req, res) => {
  const businessID = req.query.b_id || 'CL'; // Hardcoding Business ID, since the frontend will be different for each brand
  
  // Updated SQL query to include q.Q_ID
  const query = ` 
SELECT 
    business_question.Q_NUMBER, 
    questions.Q_ID,  -- Include the unique question ID
    questions.Q_TEXT, 
    questions.Q_TYPE,
    choices.Choice_1,
    choices.Choice_2,
    choices.Choice_3,
    choices.Choice_4,
    choices.Choice_5,
    choices.Choice_6
FROM 
    business_question
JOIN 
    questions ON business_question.Q_ID = questions.Q_ID
LEFT JOIN 
    choices ON questions.Q_ID = choices.Q_ID
WHERE 
    business_question.B_ID = ?
    AND business_question.active = 1
ORDER BY 
    business_question.Q_NUMBER;

  `;

  // Execute the query and handle the response
  db.query(query, [businessID], (err, results) => {
    if (err) {
      console.error('Database query error:', err); // Log the error for debugging
      res.status(500).json({ error: 'Database query failed' });
    } else {
      res.json(results);
    }
  });
});

// Start the server on port 3002
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
