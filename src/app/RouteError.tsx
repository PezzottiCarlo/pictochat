import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';
import { Button } from 'antd';
import { EmptyState, PageScaffold } from '@/components/ui';
import { paths } from './paths';

export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : undefined;

  return (
    <PageScaffold>
      <EmptyState
        icon="😕"
        title="Qualcosa non ha funzionato"
        description={detail}
        action={
          <Button type="primary" size="large" onClick={() => navigate(paths.chats, { replace: true })}>
            Torna alle chat
          </Button>
        }
      />
    </PageScaffold>
  );
}
