import { Link } from 'react-router-dom';
import { FaLinkedin, FaGithub, FaTwitter } from "react-icons/fa";
import './footer.css';

const Footer = () => {
    return (
        <footer>
            <div className="footer-content">
                <h3>WhisperWave</h3>
                <p>Never hesitate to share your ideas, we are here to help you</p>

                <ul className='socials'>
                    <li>
                        <Link to={'https://www.linkedin.com/in/md-amman/'}><FaLinkedin /></Link>
                    </li>
                    <li>
                        <Link to={'https://github.com/krazio-01'}><FaGithub /></Link>
                    </li>
                    <li>
                        <Link to={'https://twitter.com/krazio01'}><FaTwitter /></Link>
                    </li>
                </ul>
            </div>

            <div className="footer-bottom">
                <p>Copyright &copy; 2023 WhisperWave. Designed by <span>Md Amman</span></p>
            </div>
        </footer>
    )
}

export default Footer
