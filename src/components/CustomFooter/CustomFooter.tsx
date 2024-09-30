import { MessageOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Space, Tabs } from "antd";
import { router } from "../../routes/AppRoutes";

interface FooterProps {
    activeTab: number;
}


export const CustomFooter: React.FC<FooterProps> = ({ activeTab }) => {
    return (
        <Tabs
            defaultActiveKey={activeTab.toString()}
            centered
            tabBarStyle={{
                position: 'fixed',
                paddingBottom: "1rem",
                bottom: -17,
                width: '100%',
                zIndex: 1000,
                borderTop: '1px solid #f0f0f0',
                backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background
                backdropFilter: 'blur(10px)' // Blur effect
            }}
            items={[
                {
                    key: '1',
                    label: (
                        <Space direction="vertical" align="center" style={{ fontSize: '24px', margin: '0 20px' }}>
                            <MessageOutlined />
                        </Space>
                    ),
                },
                {
                    key: '2',
                    label: (
                        <Space direction="vertical" align="center" style={{ fontSize: '24px', margin: '0 20px' }}>
                            <UserOutlined />
                        </Space>
                    ),
                },
                {
                    key: '3',
                    label: (
                        <Space direction="vertical" align="center" style={{ fontSize: '24px', margin: '0 20px' }}>
                            <SettingOutlined />
                        </Space>
                    ),
                },
            ]}
            onTabClick={(key) => {
                switch (key) {
                    case '1':
                        if (activeTab === 1) return;
                        router.navigate('/contacts');
                        break;
                    case '2':
                        if (activeTab === 2) return;
                        router.navigate('/profile');
                        break;
                    case '3':
                        if (activeTab === 3) return;
                        router.navigate('/settings');
                        break;
                    default:
                        break;
                }
            }}
        />
    )
}