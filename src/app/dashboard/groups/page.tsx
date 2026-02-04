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
  UserPlus
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
              className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
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
                
                {/* Creator Badge */}
                {group.createdByUserId === session?.user?.id && (
                  <div className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                    <UserPlus className="h-3 w-3" />
                    Created by you
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsPage;