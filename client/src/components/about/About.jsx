import "./about.css";
import React from "react";

const About = () => {
    return (
        <div className="about-container">
            <div className="about-main">
                <h1>About Us</h1>
                <p>
                    Welcome to our chat web application! We're here to provide you with a seamless and enjoyable
                    chatting experience.
                </p>
                <p>Our goal is to connect people and foster meaningful conversations in a user-friendly environment.</p>
                <p>
                    Whether you're catching up with friends, collaborating on projects, or making new connections, our
                    platform is designed to make communication effortless and fun.
                </p>
                <p>Features:</p>
                <ul>
                    <li>Real-time messaging</li>
                    <li>User-friendly interface</li>
                    <li>Secure and private</li>
                    <li>Easy conversation management</li>
                </ul>
                <p>
                    We're constantly working to improve and enhance your chatting experience. If you have any
                    suggestions or feedback, we'd love to hear from you!
                </p>
                <p>
                    Contact us at: <a href="mailto:md.krazio@gmail.com">mdamman.krazio@gmail.com</a>
                </p>
            </div>
        </div>
    );
};

export default About;
