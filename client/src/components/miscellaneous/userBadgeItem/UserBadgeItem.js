import './userbadgeitem.css'
import React from 'react'
import closeMinimileIcon from '../../../Assets/images/closeMinimilistic.png'

const UserBadgeItem = ({ user, handleFunction }) => {
    return (
        <div className='badge' onClick={handleFunction}>
            {user.username}
            <img className='removeSelectedUser' src={closeMinimileIcon} alt='close' onClick={() => handleFunction}></img>
        </div>
    )
}

export default UserBadgeItem
