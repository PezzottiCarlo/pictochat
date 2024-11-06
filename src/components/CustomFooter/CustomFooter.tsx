import { MessageOutlined, TranslationOutlined, UserOutlined } from "@ant-design/icons";
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