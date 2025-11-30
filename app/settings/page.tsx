import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Settings</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your account settings and preferences.
                    </p>
                </div>
                <Separator />
                <div className="space-y-4">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="display-name">Display Name</Label>
                        <Input id="display-name" placeholder="Your Name" />
                    </div>
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="tone">Tone Preference</Label>
                        <Textarea id="tone" placeholder="e.g. Professional, Friendly, Strict" />
                        <p className="text-sm text-muted-foreground">
                            How should the AI address you and write instructions?
                        </p>
                    </div>
                    <Button>Save changes</Button>
                </div>
            </div>
        </div>
    )
}
