import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CustomFooter } from '../components/CustomFooter/CustomFooter';

const Profile: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Button type="primary" onClick={() => navigate('/')}>
                    Profile
                </Button>

            </div>
            <CustomFooter activeTab={2} />
        </div>
    );
};

export default Profile;