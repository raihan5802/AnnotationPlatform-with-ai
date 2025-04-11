import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import UserHome from './pages/UserHome';
import ProjectImageHome from './pages/ProjectImageHome';

import Detection from './pages/ImageAnnotation/DetectionPages/Detection';

import Segmentation from './pages/ImageAnnotation/SegmentationPages/Segmentation';
import Classification from './pages/ImageAnnotation/ClassificationPages/Classification';
import ThreeD from './pages/ImageAnnotation/3DPages/3D';
import Keypoints from './pages/ImageAnnotation/KeypointsPages/Keypoints';
import Caption from './pages/ImageAnnotation/CaptioningPages/Caption';

import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Tasks from './pages/Tasks';
import TasksImageHome from './pages/TasksImageHome'
import TaskInfo from './pages/TaskInfo';
import Projects from './pages/Projects';
import ProjectInfo from './pages/ProjectInfo';
import Jobs from './pages/Jobs';
import Span from './pages/TextAnnotation/Span';
import Relation from './pages/TextAnnotation/Relation';
import DocumentLevel from './pages/TextAnnotation/DocumentLevel';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/userhome" element={<UserHome />} />
      <Route path="/images" element={<ProjectImageHome />} />
      <Route path="/tasks-image-home" element={<TasksImageHome />} />

      <Route path="/detection" element={<Detection />} />

      <Route path="/segmentation" element={<Segmentation />} />
      <Route path="/classification" element={<Classification />} />
      <Route path="/3d" element={<ThreeD />} />
      <Route path="/keypoints" element={<Keypoints />} />
      <Route path="/caption" element={<Caption />} />

      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/project-info/:projectId" element={<ProjectInfo />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/task-info/:taskId" element={<TaskInfo />} />
      <Route path="/jobs" element={<Jobs />} />

      <Route path="/span" element={<Span />} />
      <Route path="/relation" element={<Relation />} />
      <Route path="/document-level" element={<DocumentLevel />} />
    </Routes>
  );
}

export default App;