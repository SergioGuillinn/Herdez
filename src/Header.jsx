import profilePicture from './assets/profilepic1.png'
import './ui.css'
function Header(){
    return(
        <header>
            <img src = {profilePicture} alt = "profile picture" className='profile-pic'></img>
        </header>

    );
}
export default Header;