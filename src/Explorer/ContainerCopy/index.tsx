import React, { Suspense } from 'react';
import CopyJobCommandBar from './CommandBar/CopyJobCommandBar';
import { ContainerCopyProps } from './Types';
import './containerCopyStyles.less';

const MonitorCopyJobs = React.lazy(() => import('./MonitorCopyJobs/MonitorCopyJobs'));

const ContainerCopyPanel: React.FC<ContainerCopyProps> = ({ container }) => {
    return (
        <div id="containerCopyWrapper" className="flexContainer hideOverflows">
            <CopyJobCommandBar container={container} />
            <Suspense fallback={<div>Loading...</div>}>
                <MonitorCopyJobs />
            </Suspense>
        </div>
    );
};

export default ContainerCopyPanel;