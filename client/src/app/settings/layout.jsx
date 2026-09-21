import Layout from '@/components/Layout';
import SettingBtnlist from '@/components/SettingBtnlist';

export default function SettingsLayout({ children }) {
    return (
        <Layout>
          <div className="app-workspace">
            <div className="app-workspace-list flex flex-col gap-4 max-h-screen">
        
                <div className="flex-1 flex-col gap-4 overflow-y-auto no-scrollbar">
                    <SettingBtnlist />
                </div>
            </div>
            <main className="app-workspace-main flex flex-col justify-start">
                {children}
            </main>

            </div>  
        </Layout>
    );
}      