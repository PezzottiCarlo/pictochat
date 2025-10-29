import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/Other/PageLayout';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <PageLayout title="Pagina non trovata" footer={null} fullWidth>
            <Result
                status="404"
                subTitle="La risorsa richiesta non esiste o è stata spostata."
                extra={<Button type="primary" onClick={() => navigate('/')}>Torna alla Home</Button>}
                style={{ paddingTop: 100 }}
            />
        </PageLayout>
    );
};

export default NotFound;
