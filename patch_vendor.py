import re

with open('frontend/src/components/VendorDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add delete function
del_func = '''
    const handleDeleteJob = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this job permanently?")) return;
        try {
            await axios.delete(/api/jobs/);
            setJobHistory(jobHistory.filter(j => j._id !== jobId));
            if (selectedJob && selectedJob._id === jobId) setSelectedJob(null);
            alert("Job deleted successfully");
        } catch (error) {
            console.error(error);
            alert("Failed to delete job");
        }
    };
'''
content = content.replace('const handleDeleteDraft = (id, e) => {', del_func + '\\n    const handleDeleteDraft = (id, e) => {')

# Add Delete button in the modal for Admins
del_btn = '''
                            {user?.role === 'admin' && (
                                <div className="mt-4 flex gap-2">
                                    <button onClick={() => handleDeleteJob(selectedJob._id)} className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700">Delete Job Post</button>
                                    <button onClick={() => alert('Full edit mode coming soon. For now, delete and repost.')} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-700">Edit</button>
                                </div>
                            )}
'''
content = content.replace('{selectedJob.cleaned_text}', '{selectedJob.cleaned_text}\\n                            ' + del_btn)

with open('frontend/src/components/VendorDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

