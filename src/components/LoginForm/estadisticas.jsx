import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import './estadisticas.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

const Estadisticas = () => {
  const [businessId, setBusinessId] = useState('');
  const [selection, setSelection] = useState('');
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [qType, setQType] = useState('');
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState(null); // For rating bar chart
  const [pieData, setPieData] = useState(null); // For rating pie chart
  const [checkboxChartData, setCheckboxChartData] = useState(null); // For checkbox bar chart
  const [checkboxPieData, setCheckboxPieData] = useState(null); // For checkbox pie chart
  const [ratingStats, setRatingStats] = useState(null);

  // Fetch questions for dropdown
  useEffect(() => {
    fetch('http://localhost:3002/api/questionsstats') // Fetch questions to be displayed in the dropdown
      .then((response) => response.json()) // Converts the response into a JSON object
      .then((data) => setQuestions(data)) // Updates the setQuestions Array
      .catch((error) => console.error('Error fetching questions:', error)); // Fetches the error and displays in console
  }, []);

  // Fetch stats for the selected question
  const fetchStats = () => {
    if (!selectedQuestion || !businessId) return;
  
    let url = `http://localhost:3002/api/getstats?businessId=${businessId}&qId=${selectedQuestion}`;
    if (selection === 'Dia' && date) url += `&date=${date}`;
    if (selection === 'Rango de Fechas' && startDate && endDate)
      url += `&startDate=${startDate}&endDate=${endDate}`;
  
    fetch(url)
      .then((response) => response.json())
      .then(({ q_type, data }) => {
        setQType(q_type);
        setData(data);
  
        if (q_type === 'rating') {
          generateRatingCharts(data); // Bar, Pie, and Text Stats
          generateLineChart(data); // Line Chart for Daily Averages
        } else if (q_type === 'checkbox') {
          generateCheckboxCharts(data);
        }
      })
      .catch((error) => console.error('Error fetching stats:', error));
  };
  
  const generateRatingCharts = (data) => { // Here we are getting the data from the backend
    const counts = Array(10).fill(0); // Initialize an array of 10 elements to count the occurence of each rating
    const values = []; // Array to store the values

    data.forEach((item) => {
        const value = parseInt(item.R_Value, 10); //Converting the values into a integer
        if (value >= 1 && value <= 10) {
            counts[value - 1]++; // Counting the occurences of each rating in r_value
            values.push(value); // Stores the value for other functions
        }
    });

    setChartData({
        labels: Array.from({ length: 10 }, (_, i) => `${i + 1}`), // Creates labels from 1 to 10 
        datasets: [
            {
                label: 'Ratings Count', // Text of the chart
                data: counts, // Data to be displayed
                backgroundColor: 'rgba(75, 192, 192, 0.6)', // Background color of the chart
                borderColor: 'rgba(75, 192, 192, 1)',       // Border color of the chart
            },
        ],
    });

    const groups = { low: 0, medium: 0, high: 0 }; // Initializes a dictionary to know how many ratings are considered for each class
    values.forEach((value) => {                   // Loops through the values to categorize the data
        if (value >= 1 && value <= 5) groups.low++;
        else if (value > 5 && value <= 7) groups.medium++;      // Categorizes the data into the according group
        else if (value > 7) groups.high++;
    });

    setPieData({
        labels: ['1-5 (Low)', '6-7 (Medium)', '8-10 (High)'],     // Labels for each color
        datasets: [
            {
                data: [groups.low, groups.medium, groups.high], // Data that will be displayed
                backgroundColor: ['#FF6384', '#FFCE56', '#36A2EB'], // Color of the pie chart
            },
        ],
    });
    

    // Calculate statistics
    if (values.length > 0) {
        const mean = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2); // Utilizes reduced method to avoid more lines
        
        const sortedValues = [...values].sort((a, b) => a - b); // Duplicates the Array and Sorts it
        const mid = Math.floor(sortedValues.length / 2); // Finds the middle index
        const median =
            sortedValues.length % 2 !== 0 // Divide to see if the array is even or odd
                ? sortedValues[mid] // If it is odd, then the middle value is the median
                : ((sortedValues[mid - 1] + sortedValues[mid]) / 2).toFixed(2); // Else you sum both of the middle values and divide by 2

        const frequencyMap = {};
        values.forEach((num) => {
            frequencyMap[num] = (frequencyMap[num] || 0) + 1; // Counts the amount of occurrences of each R_Value
        });

        const maxFrequency = Math.max(...Object.values(frequencyMap)); // Finds the highest value of the list
        const mode = Object.keys(frequencyMap) 
            .filter((key) => frequencyMap[key] === maxFrequency)
            .join(', '); // Returns the values with the mode

        const variance = (values.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / values.length).toFixed(2); // Calculates the Variance
        const stdDeviation = Math.sqrt(variance).toFixed(2); // Calcualtes the Standard Deviation

        setRatingStats({ mean, median, mode, variance, stdDeviation }); // Sets the Function to those values
    } else {
        setRatingStats({ mean: 'N/A', median: 'N/A', mode: 'N/A', variance: 'N/A', stdDeviation: 'N/A' });
    }
};

  // Generate Bar and Pie Chart Data for Checkbox Responses
  const generateCheckboxCharts = (data) => {
    const optionCounts = {};
    data.forEach((item) => {
      const options = item.R_Value.replace(/[\[\]]/g, '').split(','); // FIX: Remove `[]`
      options.forEach((option) => {
        const cleanedOption = option.trim(); // Remove leading/trailing spaces
        if (cleanedOption) {
          optionCounts[cleanedOption] = (optionCounts[cleanedOption] || 0) + 1;
        }
      });
    });
  
    setCheckboxChartData({
      labels: Object.keys(optionCounts),
      datasets: [
        {
          label: 'Responses Count',
          data: Object.values(optionCounts),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
        },
      ],
    });
  
    setCheckboxPieData({
      labels: Object.keys(optionCounts),
      datasets: [
        {
          data: Object.values(optionCounts),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        },
      ],
    });
  };
  
  // Render content dynamically based on qType
  const renderContent = () => {
    if (qType === 'comment') {
      return (
        <>
          <div className="panel">
            <h2>Comments List</h2>
            <ul>
              {data.length > 0 ? (
                data.map((item, index) => <li key={index}>{item.R_Value}</li>)
              ) : (
                <p>No comments available for this question.</p>
              )}
            </ul>
          </div>
        </>
      );
    }

    if (qType === 'rating' && chartData && pieData) {
      return (
        <>
          <div className="panel">
            <h2>Bar Chart</h2>
            <Bar data={chartData} />
          </div>
          <div className="panel">
            <h2>Pie Chart</h2>
            <Pie data={pieData} />
          </div>
          <div className="panel">
            <h2>Statistics</h2>
            <p><strong>Mean:</strong> {ratingStats.mean}</p>
            <p><strong>Median:</strong> {ratingStats.median}</p>
           <p><strong>Mode:</strong> {ratingStats.mode}</p>
           <p><strong>Variance:</strong> {ratingStats.variance}</p>
           <p><strong>Standard Deviation:</strong> {ratingStats.stdDeviation}</p>
          </div>
        </>
      );
    }

    if (qType === 'checkbox' && checkboxChartData && checkboxPieData) {
      const optionCounts = checkboxChartData.labels.reduce((acc, label, idx) => {
        acc[label] = checkboxChartData.datasets[0].data[idx];
        return acc;
      }, {});
    
      return (
        <>
          <div className="panel">
            <h2>Checkbox Responses</h2>
            <ul>
              {Object.entries(optionCounts).map(([option, count]) => (
                <li key={option}>
                  {option}: {count}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h2>Bar Chart</h2>
            <Bar data={checkboxChartData} />
          </div>
          <div className="panel">
            <h2>Pie Chart</h2>
            <Pie data={checkboxPieData} />
          </div>
        </>
      );
    }

    return <p>Select a question to see statistics.</p>;
  };

  return (
    <div className="estadisticas-page">
      <h1>Estadísticas</h1>

      {/* Filters Section */}
      <div className="filters">
        <label>Business ID</label>
        <select value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
          <option value="">Select</option>
          <option value="NT">NT</option>
          <option value="CB">CB</option>
          <option value="MY">MY</option>
          <option value="CL">CL</option>
        </select>

        <label>Selection</label>
        <select
          value={selection}
          onChange={(e) => {
            setSelection(e.target.value);
            setDate('');
            setStartDate('');
            setEndDate('');
          }}
        >
          <option value="">Select</option>
          <option value="Dia">Dia</option>
          <option value="Rango de Fechas">Rango de Fechas</option>
        </select>

        {selection === 'Dia' && (
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        )}

        {selection === 'Rango de Fechas' && (
          <>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </>
        )}

        <label>Question</label>
        <select
          value={selectedQuestion}
          onChange={(e) => setSelectedQuestion(e.target.value)}
        >
          <option value="">Select a Question</option>
          {questions.map((q) => (
            <option key={q.Q_ID} value={q.Q_ID}>
              {q.Q_TEXT}
            </option>
          ))}
        </select>

        <button onClick={fetchStats}>Fetch Statistics</button>
      </div>

      {/* Panels Section */}
      <div className="panels">{renderContent()}</div>
    </div>
  );
};

export default Estadisticas;
