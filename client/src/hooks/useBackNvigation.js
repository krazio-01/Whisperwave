import { useEffect, useRef } from 'react';

const openViewsStack = [];

const useBackNavigation = (isOpen, onBackAction) => {
    const actionRef = useRef(onBackAction);
    const idRef = useRef(Math.random().toString(36).substring(2, 9));

    useEffect(() => {
        actionRef.current = onBackAction;
    }, [onBackAction]);

    useEffect(() => {
        const handlePopState = (e) => {
            if (isOpen) {
                if (openViewsStack[openViewsStack.length - 1] === idRef.current) {
                    e.preventDefault();
                    openViewsStack.pop();
                    actionRef.current();
                }
            }
        };

        if (isOpen) {
            openViewsStack.push(idRef.current);
            window.history.pushState({ viewId: idRef.current }, '');
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            window.removeEventListener('popstate', handlePopState);

            const index = openViewsStack.indexOf(idRef.current);
            if (index > -1) openViewsStack.splice(index, 1);
        };
    }, [isOpen]);
};

export default useBackNavigation;
