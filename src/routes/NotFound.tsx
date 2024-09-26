import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1>404 - Pagina non trovata</h1>
            <Button type="primary" onClick={() => navigate('/')}>
                Torna alla Home
            </Button>
        </div>
    );
};

export default NotFound;
