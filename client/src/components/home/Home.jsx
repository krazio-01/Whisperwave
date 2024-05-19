import './home.css';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import VanillaTilt from 'vanilla-tilt';
import img from '../../Assets/images/home.png';
import Wave1 from '../../Assets/svg/Wave1';
import Wave2 from '../../Assets/svg/Wave2';

function Home() {

  useEffect(() => {
    VanillaTilt.init(document.querySelectorAll(".container__card"), {
      max: 25,
      speed: 400,
      glare: true,
      "max-glare": 1,
    });
  }, []);

  return (
    <>
      <div className="mainContainer">
        <div className="text">
          <h3>WhisperWave</h3>
          <p>Welcome to your personal place to talk about your thoughts</p>
        </div>

        <div className="image">
          <div className="content">
            <img src={img} alt="avatar" />
          </div>
        </div>
      </div>

      <div className="wave1">
        <Wave1 fill="#fda085" />
      </div>

      <div className="qualities">
        <h2>Qualities</h2>
        <div className="cards">
          <div className="container__card">
            <div className="container__card--content">
              <h3>Privacy</h3>
              <p>Protect user privacy with our chat application. We prioritize safeguarding personal information, implementing strong encryption, and giving users control over their data. Your messages remain private, and we never share or sell user data to third parties. Trust us to keep your conversations secure and maintain your privacy.</p>
              <Link to="#">Read More</Link>
            </div>
          </div>
          <div className="container__card">
            <div className="container__card--content">
              <h3>Experience</h3>
              <p>Enhance your chat experience with our user-friendly application. Enjoy seamless messaging, real-time interactions, and customizable features. We prioritize user satisfaction, ensuring smooth navigation and intuitive design. Join our platform for a delightful and hassle-free chat experience that keeps you connected with friends and loved ones effortlessly.</p>
              <Link to="#">Read More</Link>
            </div>
          </div>
          <div className="container__card">
            <div className="container__card--content">
              <h3>Scale</h3>
              <p>Scale your conversations to new heights with our robust chat application. Built on a scalable infrastructure, it handles increased user demand effortlessly. Whether you have a few users or millions, our platform ensures smooth performance, minimal downtime, and rapid message delivery. Embrace growth without compromising on chat quality and reliability.</p>
              <Link to="#">Read More</Link>
            </div>
          </div>
        </div>
      </div>


      <div className="wave2">
        <Wave2 fill="#1e1e1e" />
      </div>
    </>
  );
}

export default Home;
