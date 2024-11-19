import Skeleton from "react-loading-skeleton";
import './listitemskeleton.css';

const ListItemSkeleton = ({count}) => {
    return (
        <div className="list-skeleton">
            <div className="profileSekelton">
                <Skeleton circle className="proskel" width={45} height={45} count={count} />
            </div>
            <div className="usernameSkeleton">
                <Skeleton className="usskel" count={count} />
            </div>
        </div>
    )
}

export default ListItemSkeleton;