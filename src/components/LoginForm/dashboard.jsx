import React from 'react';
import './Dashboard.css';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const Dashboard = () => {
  return (
    <div className="dashboard-container" /* Container utilized to center elements*/> 
      <h1>Dashboard</h1>
      <div className="dashboard-section"/* Repeated the className for the different sections, 
      as it will allow CSS properties to be repeated*/>
        <h2>Statistics </h2>
        <p>View Statistics</p>
        <Link to="/estadisticas" /* Route to another page called Estadisticas*/>View </Link>
      </div>
      <div className="dashboard-section">
        <h2>Add Questions</h2>
        <p>Add Questions to Database...</p>
        <Link to="/addingquestions" /* Route to another page called addingquestions*/>View</Link> 
      </div>
      <div className="dashboard-section">
        <h2>Survey Management</h2>
        <p>Manage Survey...</p>
        <Link to="/SurveyManagement" /* Route to another page called Survey Management */>View</Link> 
      </div>
    </div>
  );
};

export default Dashboard;