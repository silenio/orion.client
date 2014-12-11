/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 ******************************************************************************/

//NLS_CHARSET=UTF-8
/*eslint-env browser, amd*/
define({
	"Navigator": "导航器",
	"Strings Xtrnalizr": "字符串 Xtrnalizr",
	"Externalize strings": "将此文件夹中的 JavaScript 文件中的字符串外部化。",
	"NotSupportFileSystem":"${0} 在此文件系统中不受支持",
	"SrcNotSupportBinRead":"源文件服务不支持读取二进制文件",
	"TargetNotSupportBinWrite":"目标文件服务不支持写入二进制文件",
	"NoFileSrv": "以下位置没有相匹配的文件服务：${0}",
	"Choose a Folder": "选择文件夹",
	"Copy of ${0}": "${0} 的副本",
	"EnterName": "为“${0}”输入新名称",
	"ChooseFolder": "选择文件夹...",
	"Rename": "重命名",
	"RenameFilesFolders": "将所选择的文件或文件夹重命名",
	"CompareEach": "相互比较",
	"Compare 2 files": "将所选的 2 个文件相互比较",
	"Compare with...": "比较对象...",
	"CompareFolders": "将所选文件夹与指定文件夹进行比较",
	"Delete": "删除",
	"Unknown item": "未知项",
	"delete item msg": "确定要删除这些 ${0} 项吗？",
	"DeleteTrg": "确定要删除“${0}”吗？",
	"Zip": "zip",
	"ZipDL": "创建文件夹内容的 zip 文件并下载该文件",
	"New File": "文件",
	"Create a new file": "创建新文件",
	"Name:": "名称：",
	"New Folder": "文件夹",
	"Folder name:": "文件夹名：",
	"Create a new folder": "创建新文件夹",
	"Creating folder": "正在创建文件夹 ",
	"Folder": "文件夹",
	"Create an empty folder": "创建空文件夹",
	"CreateEmptyMsg": "在 Orion 服务器上创建空文件夹。您可以在编辑器中导入、上载或创建内容。",
	"Sample HTML5 Site": "样本 HTML5 站点",
	"Generate a sample": "生成样本",
	"Generate an HTML5 \"Hello World\" website, including JavaScript, HTML, and CSS files.": "生成 HTML5“Hello World”Web 站点（其中包括 JavaScript、HTML 和 CSS 文件）。",
	"Creating a folder for ${0}": "正在为 ${0} 创建文件夹",
	"SFTP Import": "SFTP 导入",
	"Import content from SFTP": "从 SFTP 中导入内容",
	"Imported Content": "已导入的内容",
	"Upload a Zip": "上载 Zip 文件",
	"Upload content from a local zip file": "上载本地 zip 文件中的内容",
	"Uploaded Content": "已上载的内容",
	"Clone Git Repository": "克隆 Git 存储库",
	"Clone a git repository": "克隆 Git 存储库",
	"Link to Server": "链接至服务器",
	"LinkContent": "链接至服务器上的现有内容",
	"CreateLinkedFolder": "创建一个链接至服务器上的现有文件夹的文件夹。",
	"Server path:": "服务器路径：",
	"NameLocationNotClear": "未指定名称和服务器位置。",
	"Go Up": "上移",
	"GoUpToParent": "上移到父文件夹",
	"Go Into": "进入",
	"GoSelectedFolder": "移到所选择的文件夹中",
	"File or zip archive": "文件或 zip 归档",
	"ImportLcFile": "从本地文件系统中导入文件或 zip 归档",
	"SFTP from...": "SFTP",
	"CpyFrmSftp": "从所指定的 SFTP 连接复制文件和文件夹",
	"Importing from ${0}": "正在从 ${0} 导入",
	"SFTP to...": "SFTP",
	"CpyToSftp": "将文件和文件夹复制到所指定的 SFTP 位置",
	"Exporting": "正在导出到 ${0}",
	"Pasting ${0}": "正在粘贴 ${0}",
	"Copy to": "复制到",
	"Move to": "移至",
	"Copying ${0}": "正在复制 ${0}",
	"Moving ${0}": "正在移动 ${0}",
	"Renaming ${0}": "正在重命名 ${0}",
	"Deleting ${0}": "正在删除 ${0}",
	"Creating ${0}": "正在创建 ${0}",
	"Linking to ${0}": "正在链接至 ${0}",
	"MvToLocation": "将文件和文件夹移至新位置",
	"Cut": "剪切",
	"Copy": "复制",
	"Fetching children of ": "正在访存子代",
	"Paste": "粘贴",
	"Open With": "打开方式",
	"Loading ": "正在装入",
	"New": "新建",
	"File": "文件",
	"Actions": "操作",
	"Orion Content": "Orion 内容",
	"Create new content": "创建新内容",
	"Import from HTTP...": "HTTP",
	"File URL:": "文件 URL：",
	"ImportURL": "从 URL 导入文件，还可以选择将其解压缩",
	"Unzip *.zip files:": "将 *.zip 文件解压缩：",
	"Extracted from:": "已从以下位置解压缩：",
	"FolderDropNotSupported": "未删除 ${0}。在此浏览器中不支持删除文件夹。",
	"CreateFolderErr": "您无法将文件直接复制到工作空间中。请先创建一个文件夹。",
	"Unzip ${0}?": "要将 ${0} 解压缩吗？",
	"Upload progress: ": "上载进度：",
	"Uploading ": "正在上载 ",
	"Cancel upload": "取消上载",
	"UploadingFileErr": "上载以下文件失败：",
	"Enter project name:": "输入项目名称：",
	"Create new project" : "创建新项目",
	"Creating project ${0}": "正在创建项目 ${0}",
	"NoFile": "请使用${0}菜单来创建新的文件和文件夹。单击文件以开始编码。",
	"Download": "下载",
	"Download_tooltips": "将文件内容以所显示的名称下载",
	"Downloading...": "正在读取文件内容...",
	"Download not supported": "在此浏览器中不支持下载内容。",
	"gettingContentFrom": "从以下位置获取内容",
	"deletingLaunchConfiguration": "正在删除启动配置...",
	"deployTo": "部署至",
	"deploy": "部署",
	"connect": "连接",
	"fetchContent": "访存内容",
	"fetchContentOf": "访存以下内容",
	"disconnectFromProject": "断开与项目的连接",
	"doNotTreatThisFolder": "此文件夹不属于项目",
	"checkStatus": "检查状态",
	"checkApplicationStatus": "检查应用程序状态",
	"checkApplicationState": "检查应用程序状态",
	"stop": "停止",
	"start": "开始",
	"stopApplication": "停止应用程序",
	"startApplication": "启动应用程序",
	"manage": "管理",
	"manageThisApplicationOnRemote": "在远程服务器上管理此应用程序",
	"deleteLaunchConfiguration": "删除此启动配置",
	"deployThisApplicationAgain": "再次部署此应用程序",
	"associatedFolder": "关联的文件夹",
	"associateAFolderFromThe": "将工作空间中的文件夹与此项目相关联。",
	"convertToProject": "转换为项目",
	"convertThisFolderIntoA": "将此文件夹转换到项目中",
	"thisFolderIsAProject": "此文件夹已经是项目。",
	"basic": "基本",
	"createAnEmptyProject.": "创建空项目。",
	"sFTP": "SFTP",
	"createAProjectFromAn": "从 SFTP 站点创建项目。",
	'readMeCommandName': '自述文件',  //$NON-NLS-0$  //$NON-NLS-1$
	'readMeCommandTooltip': '在此项目中创建 README.md 文件',  //$NON-NLS-0$  //$NON-NLS-1$
	'zipArchiveCommandName': 'ZIP 归档',  //$NON-NLS-0$  //$NON-NLS-1$
	'zipArchiveCommandTooltip': '从本地 ZIP 归档中创建项目。',  //$NON-NLS-0$  //$NON-NLS-1$
	'Url:': 'Url：',  //$NON-NLS-0$  //$NON-NLS-1$
	'notZip' : '以下文件不是 zip 文件：${0}。要继续导入吗？', //$NON-NLS-0$  //$NON-NLS-1$
	'notZipMultiple' : '存在多个要上载的非 zip 文件。要继续导入吗？', //$NON-NLS-0$  //$NON-NLS-1$
	"Cancel": "取消", //$NON-NLS-0$  //$NON-NLS-1$
	"Ok": "确定", //$NON-NLS-0$  //$NON-NLS-1$
	"missingCredentials": "输入与 ${1} 关联的 ${0} 认证凭证，以检查其状态。" //$NON-NLS-0$  //$NON-NLS-1$
});

