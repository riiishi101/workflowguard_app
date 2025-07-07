import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface AnalyticsTableProps {
  analytics: any;
}

const AnalyticsTable = ({ analytics }: AnalyticsTableProps) => {
  const tableData = analytics?.userAnalytics || [];
  if (!tableData.length) {
    return <Card><CardContent>No analytics data available.</CardContent></Card>;
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle className="text-lg font-semibold">Detailed Analytics</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search..." 
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Plan</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Total Workflows</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Total Overages</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Total Revenue</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{row.email || row.userId}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{row.planId}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{row.totalWorkflows}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{row.totalOverages}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">${row.totalRevenue?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4">
                    <Badge 
                      variant={row.riskLevel === "high" ? "destructive" : row.riskLevel === "medium" ? "secondary" : "default"}
                      className={row.riskLevel === "high" ? "bg-red-100 text-red-700" : row.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}
                    >
                      {row.riskLevel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-gray-600">Showing {tableData.length} entries</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsTable; 