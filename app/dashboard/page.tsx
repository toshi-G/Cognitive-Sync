import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, FileText, Clock } from "lucide-react"

export default function DashboardPage() {
    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your instructions and cognitive syncs.</p>
                </div>
                <Link href="/studio/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Instruction
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Mock Data */}
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Project Alpha Kickoff</CardTitle>
                            <CardDescription>Created 2 hours ago</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Draft</span>
                                <Clock className="ml-auto h-4 w-4" />
                                <span className="ml-1">Updated 10m ago</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
