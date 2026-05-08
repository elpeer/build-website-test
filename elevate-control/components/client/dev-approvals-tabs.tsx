'use client';

import { useState } from 'react';
import { ApprovalsTable, type ApprovalRowData } from './approvals-table';
import { CreateApprovalForm } from './approval-card';
import type { CommentMessage } from './comment-thread';
import { Code2, Settings } from 'lucide-react';

interface ThreadInfo {
  id: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
  messages: CommentMessage[];
}

interface Props {
  frontendApprovals: ApprovalRowData[];
  cmsApprovals:      ApprovalRowData[];
  threadByApproval:  Map<string, ThreadInfo>;
  projectId: string;
  projectSlug: string;
  currentUserId: string;
  isStudio: boolean;
}

/**
 * Tabs over the development workspace approvals so frontend pages and CMS
 * pages don't fight for vertical space. The compact ApprovalsTable inside
 * each tab shows status, link, comments inline.
 */
export function DevApprovalsTabs({
  frontendApprovals, cmsApprovals, threadByApproval,
  projectId, projectSlug, currentUserId, isStudio,
}: Props) {
  const [tab, setTab] = useState<'frontend' | 'cms'>('frontend');

  return (
    <div className="space-y-3">
      <div role="tablist" className="flex gap-1 border-b border-border">
        <Tab active={tab === 'frontend'} onClick={() => setTab('frontend')}
             icon={<Code2 className="h-3.5 w-3.5" />}
             label="פרונט-אנד"
             count={frontendApprovals.length} />
        <Tab active={tab === 'cms'} onClick={() => setTab('cms')}
             icon={<Settings className="h-3.5 w-3.5" />}
             label="מערכת ניהול / WordPress"
             count={cmsApprovals.length} />
      </div>

      {tab === 'frontend' ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-fg">
            לינקים לעמודי פרונט (ה-HTML שעלה ל-Vercel/Staging). אשרו או בקשו תיקון לכל עמוד.
          </p>
          <ApprovalsTable
            approvals={frontendApprovals}
            threadByApproval={threadByApproval}
            projectId={projectId}
            projectSlug={projectSlug}
            workspace="development"
            currentUserId={currentUserId}
            isStudio={isStudio}
          />
          <CreateApprovalForm projectId={projectId} projectSlug={projectSlug}
                              workspace="development" isStudio={isStudio}
                              kind="frontend" ctaLabel="+ הוסיפו עמוד פרונט" />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-fg">
            עמודים אחרי הטמעת ניהול ב-WordPress עם תוכן ועריכה.
          </p>
          <ApprovalsTable
            approvals={cmsApprovals}
            threadByApproval={threadByApproval}
            projectId={projectId}
            projectSlug={projectSlug}
            workspace="development"
            currentUserId={currentUserId}
            isStudio={isStudio}
          />
          <CreateApprovalForm projectId={projectId} projectSlug={projectSlug}
                              workspace="development" isStudio={isStudio}
                              kind="cms" ctaLabel="+ הוסיפו עמוד CMS" />
        </div>
      )}
    </div>
  );
}

function Tab({
  active, onClick, icon, label, count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick}
            className={`relative flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
              active
                ? 'border-b-2 border-brand font-semibold text-brand -mb-px'
                : 'border-b-2 border-transparent text-muted-fg hover:text-foreground'
            }`}>
      {icon}
      <span>{label}</span>
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
        active ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-fg'
      }`}>
        {count}
      </span>
    </button>
  );
}
