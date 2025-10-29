import React from 'react';
import { Layout, Typography } from 'antd';

interface PageLayoutProps {
  title: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  // If true, content spans full width; otherwise it's centered with a max width
  fullWidth?: boolean;
}

const { Content } = Layout;
const { Title } = Typography;

export const PageLayout: React.FC<PageLayoutProps> = ({ title, headerExtra, children, footer, fullWidth }) => {
  const headerStyle: React.CSSProperties = fullWidth
    ? { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
    : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 820, margin: '0 auto' };

  const bodyStyle: React.CSSProperties = fullWidth
    ? { margin: '16px 0 0' }
    : { maxWidth: 820, margin: '16px auto 0' };

  return (
    <>
      <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ios-gray-bg)' }}>
        <Content id="scrollableDiv" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', paddingBottom: footer ? '100px' : '20px' }}>
          <div style={headerStyle}>
            <Title level={1} style={{ fontSize: 34, margin: 0, fontWeight: 700 }}>{title}</Title>
            {headerExtra}
          </div>
          <div style={bodyStyle}>
            {children}
          </div>
        </Content>
      </Layout>
      {footer}
    </>
  );
};

export default PageLayout;
