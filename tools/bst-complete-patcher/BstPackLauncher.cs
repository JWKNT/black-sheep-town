using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

internal static class BstPackLauncher
{
    private const int LanguageSwitchExitCode = 42;
    private static readonly string[] PackFiles =
    {
        "level0",
        "sharedassets0.assets",
        "resources.assets",
        "resources.resource",
    };

    [STAThread]
    private static int Main(string[] args)
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string player = Path.Combine(root, "BstPlayer.exe");
        string languageRoot = Path.Combine(root, "BSTLanguage");
        string log = Path.Combine(languageRoot, "switch.log");

        try
        {
            if (!File.Exists(player))
                throw new FileNotFoundException("The original BST player is missing.", player);

            while (true)
            {
                Process child = Process.Start(new ProcessStartInfo
                {
                    FileName = player,
                    WorkingDirectory = root,
                    UseShellExecute = false,
                    Arguments = JoinArguments(args),
                });
                child.WaitForExit();
                int exitCode = child.ExitCode;
                child.Dispose();

                if (exitCode != LanguageSwitchExitCode)
                    return exitCode;

                string currentFile = Path.Combine(languageRoot, "current.txt");
                string current = File.Exists(currentFile)
                    ? File.ReadAllText(currentFile).Trim().ToLowerInvariant()
                    : DetectCurrentPack(root, languageRoot);
                string target = current == "ja" ? "en" : "ja";
                AppendLog(log, "Language button requested " + current + " -> " + target + ".");
                InstallPack(root, languageRoot, target);
                File.WriteAllText(currentFile, target + Environment.NewLine);
                AppendLog(log, "Installed complete " + target + " pack; restarting.");
            }
        }
        catch (Exception ex)
        {
            try { AppendLog(log, "ERROR: " + ex); } catch { }
            System.Windows.Forms.MessageBox.Show(
                "BLACK SHEEP TOWN could not switch language packs.\n\n" + ex.Message +
                "\n\nSee BSTLanguage\\switch.log for details.",
                "BLACK SHEEP TOWN Language Switcher",
                System.Windows.Forms.MessageBoxButtons.OK,
                System.Windows.Forms.MessageBoxIcon.Error);
            return 3;
        }
    }

    private static void InstallPack(string root, string languageRoot, string target)
    {
        string sourceData = Path.Combine(languageRoot, target, "Bst_Data");
        string targetData = Path.Combine(root, "BstPlayer_Data");
        foreach (string name in PackFiles)
        {
            string source = Path.Combine(sourceData, name);
            string destination = Path.Combine(targetData, name);
            if (!File.Exists(source))
                throw new FileNotFoundException("Language-pack asset is missing.", source);

            Exception last = null;
            for (int attempt = 0; attempt < 30; ++attempt)
            {
                try
                {
                    File.Copy(source, destination, true);
                    last = null;
                    break;
                }
                catch (IOException ex)
                {
                    last = ex;
                    Thread.Sleep(250);
                }
            }
            if (last != null)
                throw new IOException("Could not install " + name + ".", last);
        }
    }

    private static string DetectCurrentPack(string root, string languageRoot)
    {
        string active = Path.Combine(root, "BstPlayer_Data", "level0");
        long activeLength = new FileInfo(active).Length;
        foreach (string code in new[] { "en", "ja" })
        {
            string candidate = Path.Combine(languageRoot, code, "Bst_Data", "level0");
            if (File.Exists(candidate) && new FileInfo(candidate).Length == activeLength &&
                FilesEqual(active, candidate))
                return code;
        }
        throw new InvalidDataException("The active language pack could not be identified.");
    }

    private static bool FilesEqual(string left, string right)
    {
        const int BufferSize = 1024 * 1024;
        byte[] a = new byte[BufferSize];
        byte[] b = new byte[BufferSize];
        using (FileStream x = File.OpenRead(left))
        using (FileStream y = File.OpenRead(right))
        {
            if (x.Length != y.Length) return false;
            int count;
            while ((count = x.Read(a, 0, a.Length)) > 0)
            {
                if (y.Read(b, 0, count) != count) return false;
                for (int i = 0; i < count; ++i)
                    if (a[i] != b[i]) return false;
            }
        }
        return true;
    }

    private static string JoinArguments(string[] args)
    {
        if (args == null || args.Length == 0) return "";
        string[] quoted = new string[args.Length];
        for (int i = 0; i < args.Length; ++i)
            quoted[i] = "\"" + args[i].Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
        return string.Join(" ", quoted);
    }

    private static void AppendLog(string path, string message)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path));
        File.AppendAllText(path, "[" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "] " + message + Environment.NewLine);
    }
}
