import './navbar.css';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import logo from '../../Assets/images/logo.png';
import menu from '../../Assets/images/menu.png';
import user from '../../Assets/images/user.png';

const Navbar = () => {

  const [showMenuItems, setShowMenuItems] = useState(false);

  const navigate = useNavigate();

  const handleSignInClick = () => {
    navigate("/register");
  };

  const handleMenuItemClick = () => {
    setShowMenuItems(false);
  };

  return (
    <nav className='main-nav'>
      <div className="logo">
        <div className="hamburger">
          <img src={menu} alt='Menu' onClick={() => setShowMenuItems(!showMenuItems)} />
        </div>

        <img className='webLogo' src={logo} alt='Logo' />
        <label id='whisper'>WhisperWave</label>
      </div>

      <ul className={"menu-links" + (showMenuItems ? " active" : "")}>
        <li><Link to='/' onClick={handleMenuItemClick}>Home</Link></li>
        <li><Link to='/about' onClick={handleMenuItemClick}>About</Link></li>
        <li><Link to='/contact' onClick={handleMenuItemClick}>Contact</Link></li>
      </ul>

      <div className="btn">
        <button onClick={handleSignInClick}>
          <img src={user} alt='Login' /> SignIn
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
