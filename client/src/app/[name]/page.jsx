import Layout from '@/components/Layout';

export default async function Page({ params }) {
    const { name } = await params; // Await the params object

    return (
        <Layout>
            <div className="flex flex-col w-full max-h-screen pb-4 relative rounded-l-[80px] border-l-2 border-t-3 border-b-3 border-r-0 border-solid border-black bg-white pt-7 pl-7 pr-7">
                <div>{name}</div>
            </div>
        </Layout>
    );
}
