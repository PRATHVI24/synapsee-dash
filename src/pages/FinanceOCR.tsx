import { useState, useEffect } from "react";
import { Upload, DollarSign, FileText, History, Edit3, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { financeApi } from "@/services/api";
import { FinanceDocument, ProcessingStatus } from "@/types";

const FinanceOCR = () => {
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await financeApi.getHistory();
      if (response.success) {
        setDocuments(response.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load document history",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const response = await financeApi.uploadDocument(file);
        
        if (response.success) {
          setDocuments(prev => [response.data, ...prev]);
          setUploadProgress(((i + 1) / files.length) * 100);
        }
      }
      
      toast({
        title: "Upload Successful",
        description: `${files.length} document(s) uploaded and processing started`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-finance flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            Finance OCR
          </h1>
          <p className="text-muted-foreground mt-2">
            Extract financial data from invoices, receipts, and statements with high accuracy
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="dashboard-card project-finance">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Financial Documents
          </CardTitle>
          <CardDescription>
            Upload invoices, receipts, bank statements, or tax documents for data extraction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                id="finance-upload"
                disabled={loading}
              />
              <label
                htmlFor="finance-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-finance-light flex items-center justify-center">
                  <Upload className="h-8 w-8 text-finance" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {loading ? "Processing..." : "Drop financial documents here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports PDF, JPG, PNG files
                  </p>
                </div>
              </label>
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing Progress</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Processing Dashboard</TabsTrigger>
          <TabsTrigger value="history">Document History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {documents.length === 0 ? (
            <Card className="dashboard-card">
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No documents uploaded yet</p>
                <p className="text-sm text-muted-foreground">Upload your first financial document to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="dashboard-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-finance-light flex items-center justify-center">
                          <FileText className="h-5 w-5 text-finance" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{doc.filename}</CardTitle>
                          <CardDescription>
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={doc.status === 'completed' ? 'default' : 'secondary'} className="flex items-center gap-1">
                          {getStatusIcon(doc.status)}
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  {doc.extractedData && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-3 bg-finance-light rounded-lg">
                          <p className="text-sm text-muted-foreground">Document Type</p>
                          <p className="font-medium capitalize">{doc.extractedData.documentType.replace('_', ' ')}</p>
                        </div>
                        <div className="p-3 bg-finance-light rounded-lg">
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="font-medium text-lg">{formatCurrency(doc.extractedData.amount, doc.extractedData.currency)}</p>
                        </div>
                        <div className="p-3 bg-finance-light rounded-lg">
                          <p className="text-sm text-muted-foreground">Vendor</p>
                          <p className="font-medium">{doc.extractedData.vendor}</p>
                        </div>
                        <div className="p-3 bg-finance-light rounded-lg">
                          <p className="text-sm text-muted-foreground">Confidence</p>
                          <p className="font-medium">{Math.round(doc.extractedData.confidence * 100)}%</p>
                        </div>
                      </div>

                      {doc.extractedData.items.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Extracted Line Items</h4>
                          <div className="space-y-2">
                            {doc.extractedData.items.map((item, index) => (
                              <div key={index} className="flex justify-between p-3 bg-background border border-border rounded-lg">
                                <div>
                                  <p className="font-medium">{item.description}</p>
                                  {item.quantity && <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>}
                                </div>
                                <p className="font-medium">{formatCurrency(item.amount)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingDoc(editingDoc === doc.id ? null : doc.id)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {editingDoc === doc.id ? 'Cancel Edit' : 'Edit Data'}
                        </Button>
                        <Button variant="outline" size="sm">
                          Export Data
                        </Button>
                      </div>

                      {editingDoc === doc.id && (
                        <div className="mt-4 p-4 border border-border rounded-lg bg-background">
                          <h4 className="font-medium mb-3">Edit Extracted Data</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="vendor">Vendor</Label>
                              <Input id="vendor" defaultValue={doc.extractedData.vendor} />
                            </div>
                            <div>
                              <Label htmlFor="amount">Amount</Label>
                              <Input id="amount" type="number" defaultValue={doc.extractedData.amount} />
                            </div>
                            <div>
                              <Label htmlFor="date">Date</Label>
                              <Input id="date" type="date" defaultValue={new Date(doc.extractedData.date).toISOString().split('T')[0]} />
                            </div>
                            <div>
                              <Label htmlFor="currency">Currency</Label>
                              <Input id="currency" defaultValue={doc.extractedData.currency} />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm">Save Changes</Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingDoc(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Processing History
              </CardTitle>
              <CardDescription>
                View all processed documents and their extraction results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-finance-light flex items-center justify-center">
                        <FileText className="h-5 w-5 text-finance" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(doc.uploadedAt).toLocaleDateString()} • 
                          {doc.extractedData && ` ${formatCurrency(doc.extractedData.amount)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={doc.status === 'completed' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Total Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-finance">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Documents processed</p>
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-finance">
                  {formatCurrency(
                    documents.reduce((sum, doc) => sum + (doc.extractedData?.amount || 0), 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Extracted from documents</p>
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="text-lg">Avg. Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-finance">
                  {documents.length > 0 
                    ? Math.round(
                        documents.reduce((sum, doc) => sum + (doc.extractedData?.confidence || 0), 0) / documents.length * 100
                      ) 
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">OCR accuracy rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceOCR;