import Footer from './Footer.jsx'
import Header from './Header.jsx'
import MySurvey from './components/SurveyDisplay/surveyone.jsx'
import './overrides.css'
const App = () => {
  return (
    <div className="app">
      <Header></Header>
      <MySurvey></MySurvey>
      <Footer></Footer>
    </div>
  );
};


export default App;
