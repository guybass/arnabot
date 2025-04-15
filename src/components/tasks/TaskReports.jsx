import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function TaskReports({ tasks, project }) {
  const [reportType, setReportType] = useState('overview');
  const [timeFrame, setTimeFrame] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(startOfMonth(currentDate));
  const [endDate, setEndDate] = useState(endOfMonth(currentDate));

  useEffect(() => {
    updateDateRange();
  }, [currentDate, timeFrame]);

  const updateDateRange = () => {
    if (timeFrame === 'month') {
      setStartDate(startOfMonth(currentDate));
      setEndDate(endOfMonth(currentDate));
    } else if (timeFrame === 'quarter') {
      const month = currentDate.getMonth();
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const start = new Date(currentDate);
      start.setMonth(quarterStartMonth);
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(quarterStartMonth + 2);
      end.setDate(endOfMonth(end).getDate());
      setStartDate(start);
      setEndDate(end);
    } else if (timeFrame === 'year') {
      const start = new Date(currentDate.getFullYear(), 0, 1);
      const end = new Date(currentDate.getFullYear(), 11, 31);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handlePrev = () => {
    if (timeFrame === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (timeFrame === 'quarter') {
      setCurrentDate(subMonths(currentDate, 3));
    } else if (timeFrame === 'year') {
      const newDate = new Date(currentDate);
      newDate.setFullYear(currentDate.getFullYear() - 1);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (timeFrame === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (timeFrame === 'quarter') {
      setCurrentDate(addMonths(currentDate, 3));
    } else if (timeFrame === 'year') {
      const newDate = new Date(currentDate);
      newDate.setFullYear(currentDate.getFullYear() + 1);
      setCurrentDate(newDate);
    }
  };

  // Prepare data for status distribution chart
  const getStatusDistributionData = () => {
    const counts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // Prepare data for priority distribution chart
  const getPriorityDistributionData = () => {
    const counts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // Calculate completion rate
  const getCompletionRate = () => {
    const total = tasks.length;
    if (total === 0) return 0;
    
    const completed = tasks.filter(task => task.status === 'done').length;
    return Math.round((completed / total) * 100);
  };

  // Get tasks by role
  const getTasksByRole = () => {
    const counts = tasks.reduce((acc, task) => {
      acc[task.role] = (acc[task.role] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  };

  return (
    <Card className="h-[80vh]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Reports & Analytics</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <div className="text-sm font-medium min-w-[150px] text-center">
            {timeFrame === 'month' && format(startDate, 'MMMM yyyy')}
            {timeFrame === 'quarter' && `Q${Math.floor(startDate.getMonth() / 3) + 1} ${startDate.getFullYear()}`}
            {timeFrame === 'year' && startDate.getFullYear().toString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={reportType} onValueChange={setReportType}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="priority">Priority</TabsTrigger>
            <TabsTrigger value="roles">Team Workload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold">{tasks.length}</div>
                  <div className="text-sm text-gray-500">Total Tasks</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold">{getCompletionRate()}%</div>
                  <div className="text-sm text-gray-500">Completion Rate</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold">
                    {tasks.filter(task => task.priority === 'high' || task.priority === 'urgent').length}
                  </div>
                  <div className="text-sm text-gray-500">High Priority Tasks</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getStatusDistributionData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getStatusDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={getPriorityDistributionData()}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={getStatusDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getStatusDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="priority" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={getPriorityDistributionData()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roles" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tasks by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={getTasksByRole()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}