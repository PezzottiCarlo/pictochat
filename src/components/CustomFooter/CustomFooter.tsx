import { MessageOutlined, TranslationOutlined, UserOutlined } from "@ant-design/icons";
import { Space, Tabs } from "antd";
import { router } from "../../routes/AppRoutes";

interface FooterProps {
    activeTab: number;
}


export const CustomFooter: React.FC<FooterProps> = ({ activeTab }) => {
    return (
        <Tabs
            className="footer-tabs"
            defaultActiveKey={activeTab.toString()}
            centered
            tabBarStyle={{
                position: 'fixed',
                padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
                bottom: 0,
                left: 0,
                right: 0,
                width: '100vw',
                zIndex: 1000,
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.35)',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
            }}
            items={[
                {
                    key: '1',
                    label: (
                        <Space direction="vertical" align="center" style={{ fontSize: '24px', margin: '0 20px', color: activeTab === 1 ? 'var(--ios-blue)' : 'var(--ios-text-secondary)' }}>
                            <MessageOutlined />
                        </Space>
                    ),
                },
                {
                    key: '2',
                    label: (
                        <Space direction="vertical" align="center" style={{ fontSize: '24px', margin: '0 20px', color: activeTab === 2 ? 'var(--ios-blue)' : 'var(--ios-text-secondary)' }}>
                            <UserOutlined />
                        </Space>
                    ),
                },
                {
                    key: '3',
                    label: (
                        <Space direction="vertical" align="center" style={{ fontSize: '24px', margin: '0 20px', color: activeTab === 3 ? 'var(--ios-blue)' : 'var(--ios-text-secondary)' }}>
                            <TranslationOutlined />
                        </Space>
                    ),
                }
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
                        router.navigate('/personalPictograms');
                        break;
                    default:
                        break;
                }
            }}
        />
    )
}