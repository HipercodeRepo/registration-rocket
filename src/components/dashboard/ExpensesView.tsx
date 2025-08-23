import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Download, TrendingDown, TrendingUp } from "lucide-react";

const expenses = [
  {
    category: "Venue & Catering",
    amount: 15670,
    budget: 18000,
    percentage: 87,
    trend: "under",
    transactions: 12
  },
  {
    category: "Marketing & Promotion", 
    amount: 4250,
    budget: 5000,
    percentage: 85,
    trend: "under", 
    transactions: 8
  },
  {
    category: "Technology & Equipment",
    amount: 3890,
    budget: 3500,
    percentage: 111,
    trend: "over",
    transactions: 6
  },
  {
    category: "Travel & Accommodation",
    amount: 757,
    budget: 2000,
    percentage: 38,
    trend: "under",
    transactions: 3
  }
];

const recentTransactions = [
  {
    id: 1,
    vendor: "Grand Ballroom Events",
    amount: 12500,
    category: "Venue & Catering",
    date: "2025-08-20",
    status: "processed"
  },
  {
    id: 2,
    vendor: "AV Tech Solutions", 
    amount: 2890,
    category: "Technology & Equipment",
    date: "2025-08-19",
    status: "processed"
  },
  {
    id: 3,
    vendor: "Social Media Ads",
    amount: 1500,
    category: "Marketing & Promotion", 
    date: "2025-08-18",
    status: "pending"
  }
];

export function ExpensesView() {
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalBudget = expenses.reduce((sum, exp) => sum + exp.budget, 0);
  const budgetUtilization = Math.round((totalSpent / totalBudget) * 100);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="gradient-card shadow-dashboard">
          <CardHeader>
            <CardTitle className="text-base font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="dashboard-metric text-dashboard-primary">
              ${totalSpent.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              From {recentTransactions.length + 20} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-dashboard">
          <CardHeader>
            <CardTitle className="text-base font-medium">Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="dashboard-metric">{budgetUtilization}%</div>
            <Progress value={budgetUtilization} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-1">
              ${(totalBudget - totalSpent).toLocaleString()} remaining
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-dashboard">
          <CardHeader>
            <CardTitle className="text-base font-medium">Cost Per Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="dashboard-metric text-dashboard-success">$276</div>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingDown className="h-4 w-4 text-dashboard-success" />
              <span className="text-sm text-dashboard-success">5.8% decrease</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Breakdown */}
      <Card className="gradient-card shadow-dashboard">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="dashboard-subheading">Budget Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Expense categories vs budget allocation
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.category} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{expense.category}</h4>
                    <div className="flex items-center space-x-2">
                      {expense.trend === "over" ? (
                        <TrendingUp className="h-4 w-4 text-dashboard-danger" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-dashboard-success" />
                      )}
                      <Badge variant={expense.trend === "over" ? "destructive" : "secondary"}>
                        {expense.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      ${expense.amount.toLocaleString()} / ${expense.budget.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      {expense.transactions} transactions
                    </span>
                  </div>
                  <Progress value={expense.percentage} className="mt-2 h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="gradient-card shadow-dashboard">
        <CardHeader>
          <CardTitle className="dashboard-subheading">Recent Transactions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest expense entries from Brex
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-dashboard">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-dashboard-primary" />
                  <div>
                    <div className="font-medium">{transaction.vendor}</div>
                    <div className="text-sm text-muted-foreground">{transaction.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${transaction.amount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{transaction.date}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}