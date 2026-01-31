import { RxCross2 } from 'react-icons/rx';
import './userbadgeitem.css';

const UserBadgeItem = ({ user, handleClick }) => {
    return (
        <div className="badge">
            {user.username}

            <div className="removeSelectedUser" onClick={handleClick}>
                <RxCross2 />
            </div>
        </div>
    );
};

export default UserBadgeItem;
