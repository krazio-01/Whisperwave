import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import './emptyState.css';

const EmptyState = ({ src, title, description, animationStyle = {} }) => (
    <div className="empty-state-content">
        <div className="animation-container" style={animationStyle}>
            <DotLottieReact src={src} loop autoplay />
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
    </div>
);

export default EmptyState;
