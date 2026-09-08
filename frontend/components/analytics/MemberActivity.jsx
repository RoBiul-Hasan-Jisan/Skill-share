'use client'

import { Card, Avatar } from '@/components/ui'

export function MemberActivity({
  members = [],
  auditLogs = [],
}) {
  const getMemberActivityCount = (memberId) => {
    return auditLogs.filter((log) => log.userId === memberId).length
  }

  const memberActivity = members
    .map((m) => ({
      ...m,
      activityCount: getMemberActivityCount(m.user.id),
    }))
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 10)

  const maxActivity = Math.max(...memberActivity.map((m) => m.activityCount), 1)

  return (
    <Card>
      <h3 className="font-semibold text-text-primary mb-4">Member Activity</h3>

      {memberActivity.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          No activity yet
        </div>
      ) : (
        <div className="space-y-3">
          {memberActivity.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar
                src={member.user?.avatarUrl}
                name={member.user?.name}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {member.user?.name}
                </p>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{
                      width: `${(member.activityCount / maxActivity) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs font-medium text-text-muted whitespace-nowrap">
                {member.activityCount}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
