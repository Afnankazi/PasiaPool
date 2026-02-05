'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreateGroupModal from "@/components/create-group-modal";
import { 
  Plus, 
  Users, 
  Calendar,
  ArrowRight,
  UserPlus,
  LogOut,
  Loader2
} from "lucide-react";
import { LoaderFive } from "@/components/ui/loader";

interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  assignedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  members: GroupMember[];
  _count?: {
    expenses: number;
    settlements: number;
  };
}

const GroupsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Leave group states
  const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null);
  const [groupToLeave, setGroupToLeave] = useState<Group | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Fix hydration issues by ensuring client-only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch groups on component mount
  useEffect(() => {
    if (status === 'authenticated' && isMounted) {
      fetchGroups();
    }
  }, [status, isMounted]);

  const fetchGroups = async () => {
    try {
      setError(null);
      const response = await fetch('/api/groups');
      
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a client-side only date component
  const ClientDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState<string>('Loading...');
    
    useEffect(() => {
      const formatted = new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      setFormattedDate(formatted);
    }, [dateString]);
    
    if (!isMounted) return <span>Loading...</span>;
    return <span>{formattedDate}</span>;
  };

  const handleGroupCreated = (newGroup: Group) => {
    // Add the new group to the local state
    setGroups(prev => [newGroup, ...prev]);
  };

  // Handle leaving group
  const handleLeaveGroup = async () => {
    if (!groupToLeave) return;

    setLeavingGroupId(groupToLeave.id);
    
    try {
      console.log('Attempting to leave group:', groupToLeave.id);
      const response = await fetch(`/api/groups/${groupToLeave.id}/leave`, {
        method: 'POST',
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        let errorMessage = 'Failed to leave group';
        try {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.log('Failed to parse error response:', parseError);
          // If JSON parsing fails, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Success result:', result);
      
      // Remove the group from the local state
      setGroups(prev => prev.filter(group => group.id !== groupToLeave.id));
      
      // Show success message
      alert(result.message);
      
    } catch (error) {
      console.error('Error leaving group:', error);
      alert(error instanceof Error ? error.message : 'Failed to leave group');
    } finally {
      setLeavingGroupId(null);
      setGroupToLeave(null);
      setShowLeaveConfirm(false);
    }
  };

  const confirmLeaveGroup = (group: Group, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    // Check if user is creator with multiple members
    if (group.createdByUserId === session?.user?.id && group.members.length > 1) {
      alert('Group creators cannot leave groups with other members. Please remove other members first or transfer leadership.');
      return;
    }
    
    setGroupToLeave(group);
    setShowLeaveConfirm(true);
  };

  const cancelLeaveGroup = () => {
    setGroupToLeave(null);
    setShowLeaveConfirm(false);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  if (status === 'loading' || isLoading) {
    // Explicitly render the loading component
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoaderFive text="Loading groups..." />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Groups</h1>
          <p className="text-muted-foreground mt-2">
            Manage your expense groups and split costs with friends
          </p>
        </div>
        
        <CreateGroupModal onGroupCreated={handleGroupCreated} />
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <Card className="text-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No groups yet</h3>
              <p className="text-muted-foreground">
                Create your first group to start splitting expenses
              </p>
            </div>
            <CreateGroupModal 
              onGroupCreated={handleGroupCreated}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              }
            />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card 
              key={group.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 group relative"
              onClick={() => router.push(`/dashboard/groups/${group.id}`)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {group.name}
                    </CardTitle>
                    {group.description && (
                        <CardDescription className="mt-2 text-ellipsis">
                        {group.description.length > 80
                          ? group.description.slice(0, 80) + '...'
                          : group.description}
                        </CardDescription>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Members */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</span>
                </div>
                
                {/* Stats */}
                {group._count && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{group._count.expenses} expenses</span>
                    <span>•</span>
                    <span>{group._count.settlements} settlements</span>
                  </div>
                )}
                
                {/* Created Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created <ClientDate dateString={group.createdAt} /></span>
                </div>
                
                <div className="flex items-center justify-between">
                  {/* Creator Badge */}
                  {group.createdByUserId === session?.user?.id ? (
                    <div className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      <UserPlus className="h-3 w-3" />
                      Created by you
                    </div>
                  ) : (
                    <div></div>
                  )}
                  
                  {/* Leave Button - Show on all groups */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => confirmLeaveGroup(group, e)}
                    disabled={
                      leavingGroupId === group.id || 
                      (group.createdByUserId === session?.user?.id && group.members.length > 1)
                    }
                    className={`h-8 w-8 p-0 ${
                      group.createdByUserId === session?.user?.id && group.members.length > 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                    }`}
                    title={
                      group.createdByUserId === session?.user?.id && group.members.length > 1
                        ? "Group creators cannot leave groups with other members"
                        : "Leave group"
                    }
                  >
                    {leavingGroupId === group.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Leave Group Confirmation Dialog */}
      {showLeaveConfirm && groupToLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <LogOut className="h-5 w-5" />
                Leave Group
              </CardTitle>
              <CardDescription>
                Are you sure you want to leave this group?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-medium text-sm">
                      {groupToLeave.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-red-900">{groupToLeave.name}</p>
                    <p className="text-sm text-red-600">{groupToLeave.members.length} members</p>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Warning:</strong> After leaving this group, you will:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Lose access to all group data</li>
                  <li>Be removed from payment events</li>
                  <li>No longer see expenses or settlements</li>
                  <li>Need to be re-invited to rejoin</li>
                </ul>
                {groupToLeave.createdByUserId === session?.user?.id && groupToLeave.members.length === 1 && (
                  <p className="mt-2 text-red-600 font-medium">
                    As the only member, leaving will delete this group permanently.
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={cancelLeaveGroup}
                  className="flex-1"
                  disabled={leavingGroupId === groupToLeave.id}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLeaveGroup}
                  className="flex-1"
                  disabled={leavingGroupId === groupToLeave.id}
                >
                  {leavingGroupId === groupToLeave.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Leaving...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Leave Group
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;