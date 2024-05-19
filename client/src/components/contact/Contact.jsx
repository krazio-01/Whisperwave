import './contact.css';
import { Link } from 'react-router-dom';
import React from 'react';

const Contact = () => {
  return (
    <div className="contact-container">
      <div className="contact-main">
        <h1>Contact Us</h1>
        <p>We value your feedback and are here to assist you.</p>
        <p>If you have any questions, suggestions, or inquiries, please don't hesitate to get in touch:</p>
        <div className="contact-methods">
          <div className="contact-method">
            <h2>Email</h2>
            <p>Feel free to email us at:</p>
            <p><a href="mailto:mdamman.krazio@gmail.com">mdamman.krazio@gmail.com</a></p>
          </div>
          <div className="contact-method">
            <h2>Phone</h2>
            <p>If you prefer to speak to us, you can reach us at:</p>
            <p>+91-9352072344</p>
          </div>
          <div className="contact-method">
            <h2>Social Media</h2>
            <p>Connect with us on social media:</p>
            <p>
              <Link to={'https://github.com/krazio-01'}>Github</Link> | 
              <Link to={'https://www.linkedin.com/in/md-amman/'}>LinkedIn</Link>
            </p>
          </div>
        </div>
        <p>We are dedicated to providing excellent customer service and will respond to your inquiries as soon as possible.</p>
      </div>
    </div>
  );
};

export default Contact;
