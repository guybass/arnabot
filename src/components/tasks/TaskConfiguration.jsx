import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StatusColumnManager from './StatusColumnManager';
import ColumnManager from './ColumnManager';
import { TaskColumn, StatusColumn } from '@/api/entities';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TaskConfiguration({ project, onSettingsChange }) {
  const [statusColumns, setStatusColumns] = useState([]);
  const [customColumns, setCustomColumns] = useState([]);
  const [configTab, setConfigTab] = useState('status');

  useEffect(() => {
    if (project) {
      loadData();
    }
  }, [project]);

  const loadData = async () => {
    try {
      const [status, custom] = await Promise.all([
        StatusColumn.filter({ project_id: project.id }, 'order'),
        TaskColumn.filter({ project_id: project.id }, 'order')
      ]);
      setStatusColumns(status);
      setCustomColumns(custom);
    } catch (error) {
      console.error('Error loading configuration data:', error);
    }
  };

  const handleStatusColumnsChange = async () => {
    await loadData();
    if (onSettingsChange) onSettingsChange();
  };

  const handleCustomColumnsChange = async () => {
    await loadData();
    if (onSettingsChange) onSettingsChange();
  };

  return (
    <Card className="h-[80vh]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Task Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={configTab} onValueChange={setConfigTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="status">Status Columns</TabsTrigger>
            <TabsTrigger value="custom">Custom Fields</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="mt-0">
            <ScrollArea className="h-[calc(80vh-150px)]">
              <StatusColumnManager 
                project={project}
                statusColumns={statusColumns}
                onStatusColumnsChange={handleStatusColumnsChange}
              />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="custom" className="mt-0">
            <ScrollArea className="h-[calc(80vh-150px)]">
              <ColumnManager 
                project={project}
                columns={customColumns}
                onColumnsChange={handleCustomColumnsChange}
              />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="workflows" className="mt-0">
            <div className="p-8 text-center text-gray-500">
              <h3 className="text-lg font-medium mb-2">Workflow Configuration</h3>
              <p>Configure custom workflows and automation rules for your tasks.</p>
              <p className="text-sm mt-4">This feature is coming soon!</p>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            <div className="p-8 text-center text-gray-500">
              <h3 className="text-lg font-medium mb-2">Notification Settings</h3>
              <p>Configure when and how you receive notifications about task updates.</p>
              <p className="text-sm mt-4">This feature is coming soon!</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}