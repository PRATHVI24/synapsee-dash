import { useState, useEffect } from "react";
import { Bot, Upload, Play, Pause, Video, Mic, Calendar, BarChart3, Settings, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { interviewApi } from "@/services/api";
import { Interview, InterviewSettings } from "@/types";

const AIInterview = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [interviewProgress, setInterviewProgress] = useState(0);
  const { toast } = useToast();

  const [newInterview, setNewInterview] = useState({
    candidateName: '',
    position: '',
    duration: 60,
    jobDescription: '',
    resume: ''
  });

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const response = await interviewApi.getInterviews();
      if (response.success) {
        setInterviews(response.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load interviews",
        variant: "destructive",
      });
    }
  };

  const handleCreateInterview = async () => {
    if (!newInterview.candidateName || !newInterview.position) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await interviewApi.createInterview({
        ...newInterview,
        scheduledAt: new Date()
      });
      
      if (response.success) {
        setInterviews(prev => [response.data, ...prev]);
        setNewInterview({
          candidateName: '',
          position: '',
          duration: 60,
          jobDescription: '',
          resume: ''
        });
        
        toast({
          title: "Success",
          description: "Interview created successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create interview",
        variant: "destructive",
      });
    }
  };

  const startInterview = (interview: Interview) => {
    setActiveInterview(interview);
    setIsRecording(true);
    setInterviewProgress(0);
    
    // Simulate interview progress
    const progressInterval = setInterval(() => {
      setInterviewProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsRecording(false);
          return 100;
        }
        return prev + (100 / (interview.duration * 60)) * 1; // Update every second
      });
    }, 1000);

    toast({
      title: "Interview Started",
      description: `Live interview with ${interview.candidateName}`,
    });
  };

  const stopInterview = () => {
    setIsRecording(false);
    setInterviewProgress(0);
    
    if (activeInterview) {
      // Update interview status
      setInterviews(prev => prev.map(interview => 
        interview.id === activeInterview.id 
          ? { ...interview, status: 'completed' as const }
          : interview
      ));
    }
    
    setActiveInterview(null);
    
    toast({
      title: "Interview Completed",
      description: "Processing evaluation results...",
    });
  };

  const getStatusBadge = (status: Interview['status']) => {
    const variants = {
      scheduled: "outline",
      in_progress: "secondary",
      completed: "default",
      cancelled: "destructive"
    } as const;

    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-ai flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            AI Interview Bot
          </h1>
          <p className="text-muted-foreground mt-2">
            Smart Interview Assistant with real-time evaluation and LiveKit WebRTC integration
          </p>
        </div>
      </div>

      {/* Active Interview */}
      {activeInterview && (
        <Card className="dashboard-card project-ai border-ai">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Live Interview - {activeInterview.candidateName}
                </CardTitle>
                <CardDescription>
                  {activeInterview.position} • {activeInterview.duration} minutes
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                {isRecording && <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />}
                <Badge variant={isRecording ? "destructive" : "outline"}>
                  {isRecording ? "RECORDING" : "PAUSED"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Interview Progress</span>
                <span>{Math.round(interviewProgress)}%</span>
              </div>
              <Progress value={interviewProgress} className="h-2" />
            </div>

            <div className="flex gap-2">
              {isRecording ? (
                <Button onClick={stopInterview} variant="destructive">
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Interview
                </Button>
              ) : (
                <Button onClick={() => startInterview(activeInterview)}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Interview
                </Button>
              )}
              
              <Button variant="outline">
                <Mic className="h-4 w-4 mr-2" />
                Audio Settings
              </Button>
              
              <Button variant="outline">
                <Video className="h-4 w-4 mr-2" />
                Video Settings
              </Button>
            </div>

            <div className="bg-ai-light p-4 rounded-lg">
              <p className="text-sm font-medium text-ai mb-2">LiveKit WebRTC Status</p>
              <p className="text-xs text-muted-foreground">
                Connected • Audio: Active • Video: Active • Latency: 45ms
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="setup">Interview Setup</TabsTrigger>
          <TabsTrigger value="live">Live Interface</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="results">Results & Analytics</TabsTrigger>
          <TabsTrigger value="admin">Admin Panel</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Create New Interview
              </CardTitle>
              <CardDescription>
                Set up a new interview with job description and candidate details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="candidateName">Candidate Name *</Label>
                  <Input
                    id="candidateName"
                    value={newInterview.candidateName}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, candidateName: e.target.value }))}
                    placeholder="Enter candidate name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={newInterview.position}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select 
                    value={newInterview.duration.toString()} 
                    onValueChange={(value) => setNewInterview(prev => ({ ...prev, duration: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  value={newInterview.jobDescription}
                  onChange={(e) => setNewInterview(prev => ({ ...prev, jobDescription: e.target.value }))}
                  placeholder="Paste the job description here..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="resume">Candidate Resume</Label>
                <Textarea
                  id="resume"
                  value={newInterview.resume}
                  onChange={(e) => setNewInterview(prev => ({ ...prev, resume: e.target.value }))}
                  placeholder="Paste candidate resume or upload file..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateInterview}>
                  Create Interview
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resume File
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Live Interview Interface
              </CardTitle>
              <CardDescription>
                Real-time audio/video interface with progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!activeInterview ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No active interview</p>
                  <p className="text-sm text-muted-foreground">Start an interview from the management tab</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-video bg-background border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Video className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Video Stream Placeholder</p>
                      <p className="text-sm text-muted-foreground">LiveKit WebRTC integration would be implemented here</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-ai-light rounded-lg">
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{activeInterview.duration} minutes</p>
                    </div>
                    <div className="p-3 bg-ai-light rounded-lg">
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="font-medium">{Math.round(interviewProgress)}% Complete</p>
                    </div>
                    <div className="p-3 bg-ai-light rounded-lg">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium">{isRecording ? 'Recording' : 'Paused'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Interview Management
              </CardTitle>
              <CardDescription>
                Start, stop, and monitor all interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {interviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-ai-light flex items-center justify-center">
                        <Bot className="h-5 w-5 text-ai" />
                      </div>
                      <div>
                        <p className="font-medium">{interview.candidateName}</p>
                        <p className="text-sm text-muted-foreground">
                          {interview.position} • {interview.duration} min • {new Date(interview.scheduledAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(interview.status)}
                      
                      {interview.status === 'scheduled' && (
                        <Button 
                          size="sm" 
                          onClick={() => startInterview(interview)}
                          disabled={!!activeInterview}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      )}
                      
                      {interview.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          View Results
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Total Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-ai">{interviews.length}</p>
                <p className="text-sm text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-success">
                  {interviews.filter(i => i.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Successfully completed</p>
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-ai">85</p>
                <p className="text-sm text-muted-foreground">Out of 100</p>
              </CardContent>
            </Card>
          </div>

          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Interview Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interviews.filter(i => i.evaluation).map((interview) => (
                  <div key={interview.id} className="p-4 border border-border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">{interview.candidateName}</p>
                        <p className="text-sm text-muted-foreground">{interview.position}</p>
                      </div>
                      <Badge variant="default">
                        Score: {interview.evaluation?.overallScore}/100
                      </Badge>
                    </div>
                    
                    {interview.evaluation && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Technical</p>
                          <Progress value={interview.evaluation.technicalScore} className="h-2 mt-1" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Communication</p>
                          <Progress value={interview.evaluation.communicationScore} className="h-2 mt-1" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Problem Solving</p>
                          <Progress value={interview.evaluation.problemSolvingScore} className="h-2 mt-1" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Manage interview templates and system settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Interview Templates</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                    <span>Frontend Developer Template</span>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                    <span>Backend Developer Template</span>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border border-border rounded-lg">
                    <span>Full Stack Developer Template</span>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">System Settings</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Default Interview Duration</Label>
                    <Select defaultValue="60">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label>Auto-evaluation Enabled</Label>
                    <Button variant="outline" size="sm">Enabled</Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label>Video Recording</Label>
                    <Button variant="outline" size="sm">Enabled</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIInterview;