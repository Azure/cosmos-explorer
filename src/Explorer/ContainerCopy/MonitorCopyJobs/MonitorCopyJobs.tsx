import React from 'react';
import CopyJobsNotFound from '../MonitorCopyJobs/Components/CopyJobs.NotFound';

interface MonitorCopyJobsProps { }

const MonitorCopyJobs: React.FC<MonitorCopyJobsProps> = () => {
    return (
        <div className='monitorCopyJobs flexContainer'>
            <CopyJobsNotFound />
        </div>
    );
}

export default MonitorCopyJobs;