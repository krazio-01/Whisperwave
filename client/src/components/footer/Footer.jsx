import './footer.css';
import React from 'react';
import { Link } from 'react-router-dom';
import linkedin from '../../Assets/images/linkedin.png';
import github from '../../Assets/images/github.png';
import twitter from '../../Assets/images/twitter.png';

const Footer = () => {
    return (
        <>
            {/* <div className="wave2"></div> */}
            <footer>
                <div className="footer-content">
                    <h3>WhisperWave</h3>
                    <p>Never hesitate to share your ideas, we are here to help you</p>

                    <ul className='socials'>
                        <li>
                            <Link to={'https://www.linkedin.com/in/md-amman/'}><img src={linkedin} alt="linkedin--v1" /></Link>
                        </li>
                        <li>
                            <Link to={'https://github.com/krazio-01'}><img src={github} alt="github--v1" /></Link>
                        </li>
                        <li>
                            <Link to={'https://twitter.com/krazio01'}><img src={twitter} alt="twitter--v1" /></Link>
                        </li>
                    </ul>
                </div>

                <div className="footer-bottom">
                    <p>Copyright &copy; 2023 WhisperWave. Designed by <span>Md Amman</span></p>
                </div>
            </footer>

        </>
    )
}

export default Footer
